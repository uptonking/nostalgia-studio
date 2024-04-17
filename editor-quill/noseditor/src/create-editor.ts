import './index.scss';

import Quill from 'quill';
import type Delta from 'quill-delta';

import { Image } from './modules/formats-custom/image';
import { ListItem } from './modules/formats-custom/list-item';
import { ImageDrop } from './modules/image-paste-drop';
import ImageResize from './modules/image-resize';
import { MagicUrl } from './modules/magic-url';
import MarkdownShortcuts from './modules/markdown-shortcuts';
import TableEditable from './modules/table-editable/table';
import ImageHandler from './modules/toolbar/image';
import { LinkHandler } from './modules/toolbar/link';
import TableHandler from './modules/toolbar/table';
import { lineBreakMatcher } from './utils/elements';

interface IModules {
  // table?: boolean | IBetterTable;
  codeHighlight?: boolean | { key: string; label: string }[];
  imageResize?: boolean | {};
  imageDrop?: boolean | {};
  magicUrl?: boolean;
  markdown?: boolean;
  link?: boolean | {};
}

type CreateNoseditorOptions = {
  container: string | HTMLElement;
  placeholder?: string;
  readOnly?: boolean;
  modules?: {
    imageHandler?: {
      imgUploadApi?: (formData: any) => Promise<string>;
      uploadSuccCB?: (data: unknown) => void;
      uploadFailCB?: (error: unknown) => void;
      imgRemarkPre?: string;
      maxSize?: number;
      imageAccept?: string;
    };
    toolbarOptions?: [][];
    table?: {};
  } & IModules;
  // getQuill?: (quill: Quill, uploadedImgsList?: string[]) => void;
  content?: Delta | string;
  initialContent?: string;
  onChange?: (delta: Delta, old: Delta) => void;
  onFocus?: (range?: any) => void;
  onBlur?: (oldRange?: any) => void;
  i18n?: 'en' | 'zh';
  // [k: string]: any;
};

// 允许图片的样式保存在Delta中
Quill.register(Image, true);
Quill.register(ListItem, true);

export const createNoseditor = (options: CreateNoseditorOptions) => {
  const {
    container,
    modules = { magicUrl: true },
    content,
    initialContent,
    i18n = 'en',
    readOnly = false,
    placeholder,
    onChange,
    onFocus,
    onBlur,
  } = options;

  // const toolbarOptions = modules.toolbarOptions || [
  const toolbarDefaultOptions = [
    // ['undo', 'redo', 'clean'],
    [
      // { font: ['system', 'wsYaHei', 'songTi', 'serif', 'arial'] },
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
      // { script: 'sub' },
      // { script: 'super' },
      // modules['table-editable'] ? 'table' : undefined,
    ],
  ];

  // modules enabled by default
  Quill.register(
    {
      'modules/magicUrl': MagicUrl,
      'modules/imageResize': ImageResize,
      'modules/imageDrop': ImageDrop,
      'modules/markdownShortcuts': MarkdownShortcuts,
      'modules/tableHandler': TableHandler,
      'modules/linkHandler': LinkHandler,
      'modules/imageHandler': ImageHandler,
      // 'modules/codeHandler': CodeHandler,
      // 'modules/qSyntax': QSyntax,
    },
    true,
  );

  if (modules['table-editable']) {
    Quill.register(
      {
        'modules/table-editable': TableEditable,
      },
      true,
    );
  }

  const noseditor = new Quill(container, {
    debug: false,
    modules: {
      ...modules,
      toolbar: {
        container: toolbarDefaultOptions,
        handlers: {},
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

  noseditor.on('selection-change', (range, oldRange, source) => {
    if (range == null || !noseditor?.hasFocus()) return;

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
    noseditor.setContents(JSON.parse(initialContent));
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

  if (noseditor) {
    if (readOnly) {
      noseditor.enable(false);
    } else {
      noseditor.enable();
    }
  }

  return noseditor;
};
