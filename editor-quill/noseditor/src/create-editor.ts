import Quill from 'quill';
import type Delta from 'quill-delta';
import type { FontClass as QuillFontClass } from 'quill/src/formats/font';
import type { SizeStyle as QuillSizeStyle } from 'quill/src/formats/size';

import { Image } from './modules/formats-custom/image';
import { ListItem } from './modules/formats-custom/list-item';
import { ImageDrop } from './modules/image-paste-drop';
import { ImageResize } from './modules/image-resize';
import { MagicUrl } from './modules/magic-url';
import { MarkdownShortcuts } from './modules/markdown-shortcuts';
import { tableMenuZh } from './modules/table-editable/config';
import { TableEditable } from './modules/table-editable/table';
import { toolbarInit } from './modules/toolbar';
import { ImageHandler } from './modules/toolbar/image';
import { LinkHandler } from './modules/toolbar/link';
import { TableHandler } from './modules/toolbar/table';
import type { TableEditableOptions } from './types';
import { setContent } from './utils/common';
import { lineBreakMatcher } from './utils/elements';
import { getI18nText } from './utils/i18n';

interface ModulesOptions {
  toolbarOptions?: any[][];
  table?: boolean | TableEditableOptions;
  tableHandler?: TableEditableOptions['toolbarOptions'] | boolean;
  tableEditable?: Record<string, any>;
  imageHandler?: {
    imgUploadApi?: (formData: any) => Promise<string>;
    uploadSuccCB?: (data: unknown) => void;
    uploadFailCB?: (error: unknown) => void;
    imgRemarkPre?: string;
    maxSize?: number;
    imageAccept?: string;
    i18n?: Record<string, any>;
  };
  imageResize?: boolean | {};
  imageDrop?: boolean | {};
  link?: boolean | {};
  linkHandler?: boolean | { i18n: Record<string, any> };
  magicUrl?: boolean;
  codeHighlight?: boolean | { key: string; label: string }[];
  syntax?: any;
  markdown?: boolean;
  markdownShortcuts?: boolean;
}

export type CreateNoseditorOptions = {
  container: string | HTMLElement;
  placeholder?: string;
  readOnly?: boolean;
  modules?: ModulesOptions;
  initialContent?: string;
  onChange?: (delta: Delta, old: Delta) => void;
  onFocus?: (range?: any) => void;
  onBlur?: (oldRange?: any) => void;
  i18n?: 'en' | 'zh';
};

// 允许图片的样式保存在Delta中
Quill.register(Image, true);
Quill.register(ListItem, true);

export const createNoseditor = (options: CreateNoseditorOptions) => {
  const {
    container,
    modules = {
      table: true,
      // tableEditable: true,
      linkHandler: true,
      magicUrl: true,
      markdownShortcuts: true,
      imageHandler: true,
      imageResize: true,
      imageDrop: true,
      ...options.modules,
    },
    initialContent,
    i18n = 'en',
    readOnly = false,
    placeholder,
    onChange,
    onFocus,
    onBlur,
  } = options;

  // modules enabled by default
  Quill.register(
    {
      'modules/tableHandler': TableHandler,
      'modules/imageHandler': ImageHandler,
      'modules/imageResize': ImageResize,
      'modules/imageDrop': ImageDrop,
      'modules/magicUrl': MagicUrl,
      'modules/linkHandler': LinkHandler,
      'modules/markdownShortcuts': MarkdownShortcuts,
      // 'modules/codeHandler': CodeHandler,
      // 'modules/qSyntax': QSyntax,
    },
    true,
  );

  if (modules.table) {
    modules.table = false;
    modules.tableEditable = {
      // i18n,
      operationMenu: {
        items:
          (typeof modules.table !== 'boolean' &&
            modules.table['operationMenu']) ||
          (i18n === 'zh' ? tableMenuZh : {}),
        color: {
          colors: ['#d1fae5', '#cca4e3', '#4994C4', '#e5e7eb', '#fff'], // 背景色值
          text: getI18nText('tableBackground', i18n), // subtitle, 'Background Colors' as default
          // @ts-expect-error fix-types
          ...(typeof modules.table !== 'boolean'
            ? modules.table['backgroundColors']
            : null),
        },
      },
    };

    modules.tableHandler = {
      // i18n,
      ...(typeof modules.table !== 'boolean'
        ? modules.table['toolbarOptions']
        : {}),
    };
  }

  if (modules.tableEditable) {
    Quill.register(
      {
        'modules/tableEditable': TableEditable,
      },
      true,
    );
  }

  if (modules.imageResize) {
    // modules.imageResize =
    //   imageResize === false
    //     ? imageResize
    //     : {
    //         i18n,
    //         ...(typeof imageResize === 'object' ? imageResize : null),
    //       };
  }
  if (modules.imageDrop) {
    // modules.imageDrop =
    //   imageDrop === false
    //     ? imageDrop
    //     : {
    //         i18n,
    //         imageHandler,
    //         // uploadedImgsList: uploadedImgsList.current,
    //         ...(typeof imageDrop === 'object' ? imageDrop : null),
    //       };
  }

  // toolbarHandlers.current.undo = () => undoHandler(quillRef.current!);
  // toolbarHandlers.current.redo = () => redoHandler(quillRef.current!);

  const { toolbarOptions } = modules;
  let fontList = ['system', 'wsYaHei', 'songTi', 'serif', 'arial'];
  let sizeList = ['12px', '14px', '18px', '36px'];
  if (toolbarOptions) {
    toolbarOptions.forEach((formats) => {
      if (Array.isArray(formats)) {
        formats.forEach((format: { font?: []; size?: [] }) => {
          if (typeof format === 'object') {
            if (format.font && Array.isArray(format.font)) {
              fontList = format.font;
            }
            if (format.size && Array.isArray(format.size)) {
              sizeList = format.size;
            }
          }
        });
      }
    });
  }

  const SizeStyle = Quill.import(
    'attributors/style/size',
  ) as typeof QuillSizeStyle;
  SizeStyle.whitelist = sizeList;
  Quill.register(SizeStyle, true);
  const FontClass = Quill.import('formats/font') as typeof QuillFontClass;
  FontClass.whitelist = fontList;
  Quill.register(FontClass, true);
  // const icons = Quill.import('ui/icons');
  // icons.undo = IconUndo;
  // icons.redo = IconRedo;

  const toolbarDefaultOptions = [
    // ['undo', 'redo', 'clean'],
    [
      { font: ['system', 'wsYaHei', 'songTi', 'serif', 'arial'] },
      { size: ['12px', false, '18px', '36px'] },
      { header: [false, 1, 2, 3, 4] },
    ],
    [
      'bold',
      'italic',
      'underline',
      'strike',
      { color: [] },
      { background: [] },
    ],
    [
      { list: 'ordered' },
      { list: 'bullet' },
      { list: 'check' },
      { indent: '-1' },
      { indent: '+1' },
      { align: [] },
    ],
    [
      'blockquote',
      // modules.codeHighlight ? 'code-block' : undefined,
      modules.link !== false ? 'link' : undefined,
      'image',
      { script: 'sub' },
      { script: 'super' },
      modules.tableEditable ? 'table' : undefined,
    ],
  ];
  const nosToolbarOptions = modules.toolbarOptions || toolbarDefaultOptions;

  console.log(';; ql-modules ', modules, container);
  const noseditor = new Quill(container, {
    debug: 'warn',
    modules: {
      ...modules,
      toolbar: {
        container: nosToolbarOptions,
        // handlers: { ...toolbarHandlers },
      },
      clipboard: {
        matchers: [['BR', lineBreakMatcher]],
      },
      // keyboard: {
      //   bindings: {
      //     ...QuillBetterTable.keyboardBindings,
      //     ...keyboardBinds,
      //   },
      // },

      history: {
        // delay: 2000,
        maxStack: 100,
        userOnly: true,
      },
    },
    placeholder: placeholder || 'hello, noseditor',
    readOnly,
    // bounds: document.querySelector(`#editor${editorId.current}`) as HTMLElement,
    theme: 'snow',
  });

  toolbarInit(noseditor, i18n);

  noseditor.on('selection-change', (range, oldRange, source) => {
    if (!range || !noseditor.hasFocus()) return;

    // 当新建table或者选中table时，禁止部分toolbar options，添加table时触发的source=api
    if (modules.table && noseditor) {
      const disableInTable = [
        'header',
        'blockquote',
        'code-block',
        'hr',
        'list',
      ];
      const format = noseditor.getFormat() || {};
      if (format && format['table-cell-line']) {
        // optionDisableToggle(noseditor, disableInTable, true);
      } else {
        // optionDisableToggle(noseditor, disableInTable, false);
      }
    }
  });

  if (initialContent) {
    setContent(initialContent, noseditor);
  }

  if (onChange) {
    noseditor.on('text-change', (delta: Delta, old: Delta, source) => {
      if (source === 'user') onChange(delta, old);
    });
  }
  if (onFocus || onBlur) {
    noseditor.on('selection-change', (range, oldRange, source) => {
      const hasFocus = range && !oldRange;
      const hasBlur = !range && oldRange;
      if (onFocus && hasFocus) onFocus(range);
      if (onBlur && hasBlur) onBlur(oldRange);
    });
  }

  if (readOnly) {
    noseditor.enable(false);
  } else {
    noseditor.enable();
  }

  return noseditor;
};
