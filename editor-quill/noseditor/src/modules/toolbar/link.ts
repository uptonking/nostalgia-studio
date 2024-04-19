import normalizeUrl from 'normalize-url';
import Quill, { type Range } from 'quill';
import type DefaultModule from 'quill/src/core/module';

import { genIconDom, iconsConfig } from '../../config/icons-config';
import { isEmail, isUrl } from '../../utils/common';
import { getI18nText } from '../../utils/i18n';

const Module = Quill.import('core/module') as typeof DefaultModule;

export class LinkHandler extends Module<Record<string, any>> {
  toolbar: any;
  editorContainer: any;
  tooltip: any;
  wordDom: any;
  urlDom: any;
  saveDom: any;
  clearDom: any;
  jumpDom: any;
  selection: Range;

  constructor(quill, options) {
    super(quill, options);

    this.quill = quill;
    this.options = options || {};
    this.toolbar = quill.getModule('toolbar');
    this.editorContainer = quill.root.parentNode;
    this.tooltip = quill.theme?.tooltip;

    if (typeof this.toolbar !== 'undefined') {
      this.toolbar.addHandler('link', this.handleLinkClick.bind(this));
    }

    quill.on('selection-change', (range, oldRange, source) => {
      try {
        if (range == null || !quill?.hasFocus()) return;

        // 当选中link格式时，弹出tooltip并能修改保存
        if (source === 'user') {
          const LinkBlot = Quill.import('formats/link');
          const [link, offset] = quill.scroll.descendant(LinkBlot, range.index);
          if (link !== null) {
            // quill!.theme?.tooltip?.root?.classList.add('ql-editing');
            const [leaf] = quill.getLeaf(range.index + 1);
            this.tooltip?.edit('link', '');

            const start = range.index - offset;
            const len = link.length();
            const url = quill.getFormat(start, len).link;
            if (this.editorContainer) {
              if (!this.wordDom) {
                this.getDom(); // this.wordDom在没有点击toolbar时为空，没有初始化
              }
              this.wordDom.value = leaf.text;
              this.urlDom.value = url;
              this.saveDom.onclick = () => {
                this.saveLink(start, len);
              };
              this.clearDom.onclick = () => this.clearLink(start, len);
            }
          } else {
            this.tooltipClose();
          }
        }
      } catch (e) {
        console.log('Link Listener Error: ', e);
      }
    });

    // 添加全局 Link Tooltip Dom，替换原 snow 的 tooltip
    if (this.quill.theme && this.quill.theme['tooltip']) {
      // @ts-expect-error fix-types
      this.quill.theme.tooltip.root.innerHTML = LinkHandler.linkTooltip(
        options.i18n,
      );
    }
    quill.on('text-change', this.tooltipClose);
  }

  getDom = () => {
    if (this.editorContainer) {
      this.wordDom = this.editorContainer.querySelector('#link-words');
      this.urlDom = this.editorContainer.querySelector('#link-url');
      this.saveDom = this.editorContainer.querySelector('a.ql-link-save');
      this.jumpDom = this.editorContainer.querySelector('a.ql-link-jump');
      this.clearDom = this.editorContainer.querySelector('a.ql-link-clear');
      this.selection = this.quill.getSelection();
      this.jumpDom.onclick = this.jumpLink;
      this.clearDom.onclick = this.clearLink;
    }
  };
  handleLinkClick() {
    this.tooltip?.edit('link', '');
    this.getDom();

    // 当没有选中任何文本，直接弹出tooltip并能插入文本、超链接
    if (this.selection === null || this.selection.length === 0) {
      this.wordDom.value = '';
      this.urlDom.value = '';
      this.saveDom.onclick = () => {
        this.saveLink();
      };
    } else {
      // 当有选中文本，弹出tooltip后允许修改此文本，并能插入超链接
      const text = this.quill.getText(
        this.selection.index,
        this.selection.length,
      );
      this.wordDom.value = text;

      let href = ''; // 最终超链接的地址value
      if (isEmail(text) && text.indexOf('mailto:') !== 0) {
        href = `mailto:${text}`;
      } else if (isUrl(text)) {
        href = normalizeUrl(text, { stripWWW: false });
      }
      this.urlDom.value = href;
      this.saveDom.onclick = () => {
        this.saveLink(this.selection.index, this.selection.length);
      };
    }
  }

  // 保存 Link 到编辑器，有startIndex且length>0代表需要替换
  saveLink(startIndex?, length?) {
    const url = this.urlDom.value;
    if (url && isUrl(url)) {
      const words = this.wordDom.value || url;
      if (startIndex !== undefined && length && length > 0) {
        this.quill.deleteText(startIndex, length);
      }
      this.quill.insertText(
        startIndex ?? (this.selection?.index || 0),
        words,
        'link',
        normalizeUrl(url, { stripWWW: false }),
        'user',
      );
      this.tooltipClose();
    } else {
      this.invalidUrlhandler();
    }
  }

  jumpLink = () => {
    const url = this.urlDom.value;
    if (url && isUrl(url)) {
      window.open(normalizeUrl(url, { stripWWW: false }), '_blank');
      this.tooltipClose();
    } else {
      this.invalidUrlhandler();
    }
  };
  clearLink = (startIndex, length) => {
    const url = this.urlDom.value;
    if (url && isUrl(url) && this.selection) {
      this.quill.removeFormat(
        startIndex ?? this.selection.index,
        length ?? this.selection.length,
      );
    }
    this.tooltipClose();
  };

  tooltipClose = () => {
    if (this.tooltip && this.tooltip.hide) this.tooltip.hide();
  };

  invalidUrlhandler = () => {
    if (this.tooltip && this.tooltip.root) {
      const err = getI18nText('linkUrlErr', this.options.i18n);
      const tips = this.tooltip.root.querySelector('.err-tips');
      tips.innerText = err;
      this.urlDom.addEventListener('input', () => {
        if (tips.innerText) tips.innerText = '';
      });
    }
    this.urlDom.focus();
  };

  static linkTooltip = (i18n) => {
    const words = getI18nText(
      ['linkWords', 'linkUrl', 'linkSave', 'linkTarget', 'linkClear'],
      i18n,
    );
    return `
<p><span>${words[0]}：</span><input id="link-words" class="text-input" type="text" /></p>
<p class="flex flex-center">
<span>${words[1]}：</span><input id="link-url" class="text-input" type="text" />
<a class="ql-link-save">${words[2]}</a>
<a class="ql-link-jump" target="_blank">${genIconDom(iconsConfig.jumpIcon, words[3], 'ql-icon')}</a>
<a class="ql-link-clear">${genIconDom(iconsConfig.unlinkIcon, words[4], 'ql-icon')}</a>
</p>
<p class="err-tips"></p>
  `;
  };
}
