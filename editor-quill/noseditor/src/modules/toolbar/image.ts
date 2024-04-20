import Quill from 'quill';
import type DefaultModule from 'quill/src/core/module';
import type DefaultToolbar from 'quill/src/modules/toolbar';

import { isUrl } from '../../utils/common';
import { getI18nText } from '../../utils/i18n';

const Module = Quill.import('core/module') as typeof DefaultModule;

type ImageHandlerOptions = {
  /** 图片上传API，API返回的应该是结果为URL的Promise */
  imgUploadApi?: (formData: FormData) => Promise<string>;
  /** 上传成功回调 */
  uploadSuccCB?: (data: unknown) => void;
  /** 上传失败回调 */
  uploadFailCB?: (error: unknown) => void;
  /** 添加备注的统一前置字符串，可为空字符串 */
  imgRemarkPre?: string;
  /** 上传本地图片最大体积，单位MB，默认为5MB */
  maxSize?: 5;
  /** 上传本地图片可以接受的图片类型，默认 image/png, image/gif, image/jpeg */
  imageAccept?: string;
  i18n?: 'zh' | 'en';
  dialogWidth?: number;
};

const defaultOptions: ImageHandlerOptions = {
  dialogWidth: 360,
};

/**
 * 默认插入图片转为base64后保存在Delta
 */
export class ImageHandler extends Module<ImageHandlerOptions> {
  toolbar: DefaultToolbar;
  imageDialogRoot: HTMLElement;
  imgFileInput: HTMLInputElement;
  imgTextInput: HTMLInputElement;

  constructor(quill, options) {
    super(quill, options);
    this.options = { ...defaultOptions, ...options };
    this.toolbar = quill.getModule('toolbar') as DefaultToolbar;
    if (this.toolbar) {
      this.toolbar.addHandler('image', this.handleAddImageClick.bind(this));
    }
  }

  handleAddImageClick() {
    const range = this.quill.getSelection(true);
    if (!range) return;

    this.openImageDialog();
    this.quill.container.addEventListener('click', () => {
      this.closeImageDialog();
    });
    window.addEventListener('resize', () => {
      this.closeImageDialog();
    });
  }

  openImageDialog() {
    if (this.toolbar.container.querySelector('.ql-image-dialog')) {
      this.imageDialogRoot.remove();
      return;
    }
    this.renderImageDialogContent();
  }

  renderImageDialogContent() {
    const toolbarContainer = this.toolbar.container;
    if (!this.imageDialogRoot) {
      this.imageDialogRoot = document.createElement('div');
      this.imageDialogRoot.classList.add('ql-image-dialog');
      const words = getI18nText(
        ['imageDialogLocal', 'imageDialogUrlLabel', 'imageDialogInsert'],
        this.options.i18n,
      );
      this.imageDialogRoot.innerHTML = `
      <input type="file" class="ql-image-upload" accept="${
        this.options.imageAccept ||
        'image/png, image/gif, image/jpeg, image/bmp, image/x-icon'
      }" />
      <button class="local-image">${words[0]}</button>
      <p class="err-tips err-file"></p>
      <p class="url-label">${words[1]}</p>
      <div class="image-url-form">
      <input class="text-input" type="text" placeholder="https://example.com/img.png" />
      <div>
      <button class="insert-image"><span class="url-submit">${words[2]}</span></button>
      </div>
      </div>
      <p class="err-tips err-url"></p>
      `;

      this.imgTextInput =
        this.imageDialogRoot.querySelector<HTMLInputElement>(
          'input.text-input',
        );
      this.imgTextInput.onclick = (e) => {
        // 阻止冒泡导致 imageDialog 消失
        e.stopPropagation();
      };
      this.imageDialogRoot.querySelector<HTMLElement>('.url-submit').onclick = (
        e,
      ) => {
        e.stopPropagation();
        const url = this.imgTextInput.value;
        if (url && isUrl(url)) {
          this.insertImage(url);
          this.closeImageDialog();
          this.imgTextInput.value = '';
          this.quill.enable(true);
        } else {
          const tips =
            this.imageDialogRoot.querySelector<HTMLElement>(
              '.err-tips.err-url',
            );
          tips.innerText = getI18nText(
            'linkUrlErr',
            this.options.i18n,
          ) as string;
          this.imgTextInput?.addEventListener('input', () => {
            if (tips.innerText) tips.innerText = '';
          });
        }
      };

      this.imgFileInput = this.imageDialogRoot.querySelector(
        'input.ql-image-upload[type=file]',
      );
      this.imageDialogRoot.querySelector<HTMLElement>(
        'button.local-image',
      ).onclick = (e) => {
        e.stopPropagation();
        this.imgFileInput.click();
        this.imageDialogRoot.querySelector<HTMLElement>(
          '.err-tips.err-file',
        ).innerText = '';
      };

      this.imgFileInput.onchange = () => {
        const { files } = this.imgFileInput;
        if (!files || !files.length) {
          return;
        }

        // // 请求图片保存API
        // const { imgUploadApi, uploadSuccCB, uploadFailCB } = this.options;
        // if (imgUploadApi) {
        //   ImageHandler.uploadImg(
        //     files[0],
        //     imgUploadApi,
        //     (url) => {
        //       this.insertImage(url);
        //       if (uploadSuccCB) uploadSuccCB(url);
        //     },
        //     (error) => {
        //       this.quill.enable(true);
        //       if (uploadFailCB) uploadFailCB(error);
        //     },
        //   );
        // }

        // 先将图片转 base64 插入编辑器中，再由 imagePasteDrop上传，用户能更快看到图片，后台上传
        // todo support multi images
        this.beforeUpload(files[0]);
      };
    } else {
      this.imgFileInput.value = '';
      this.imgTextInput.value = '';
    }

    const imageIcon = toolbarContainer.querySelector('.ql-image');
    const pos = this.computeDialogPosition(imageIcon);
    this.imageDialogRoot.style.setProperty('left', pos.left + 'px');
    this.imageDialogRoot.style.setProperty('top', pos.top + 'px');
    toolbarContainer.append(this.imageDialogRoot);
  }

  beforeUpload(file) {
    const tips =
      this.imageDialogRoot.querySelector<HTMLElement>('.err-tips.err-file');
    const words = getI18nText(
      ['imageDialogTypeErr', 'imageDialogSizeErr'],
      this.options.i18n,
    );
    // 判断文件的后缀，至于用户强制改变文件后缀，这里不做考虑
    if (!file.type.startsWith('image/')) {
      tips.innerText = words[0];
      this.renderImageDialogContent();
      return;
    }
    const isLt5M = file.size / 1024 / 1024 < (this.options.maxSize || 5);
    if (!isLt5M) {
      tips.innerText = words[1].replace('$', String(this.options.maxSize || 5));
      this.renderImageDialogContent();
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const base64Str = e.target.result;
      this.insertImage(base64Str);
    };
  }

  closeImageDialog() {
    if (this.imageDialogRoot) {
      this.imageDialogRoot.remove();
    }
  }

  computeDialogPosition(clickDom) {
    const parent = clickDom.offsetParent;
    const width = this.options.dialogWidth;
    if (parent.offsetWidth > clickDom.offsetLeft + width) {
      return { top: clickDom.offsetTop + 24, left: clickDom.offsetLeft + 6 };
    } else {
      return { top: clickDom.offsetTop + 24, left: parent.offsetWidth - width };
    }
  }

  insertImage = (url) => {
    this.closeImageDialog();
    // this.quill.enable(true);
    const range = this.quill.getSelection(true);
    this.quill.insertEmbed(range.index, 'image', url, 'user');
    this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
    this.imgFileInput.value = '';
  };
}

export default ImageHandler;
