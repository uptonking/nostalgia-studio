export type KeyboardBindingOption = {
  key: string;
  collapsed?: boolean;
  format?: string[];
  suffix?: RegExp;
  offset?: number;
  shiftKey?: object;
  handler: (range, context) => any;
};

export type TableEditableOptions = {
  operationMenu?: {
    insertColumnRight?: {
      text: string;
    };
    insertColumnLeft?: {
      text: string;
    };
    insertRowUp?: {
      text: string;
    };
    insertRowDown?: {
      text: string;
    };
    mergeCells?: {
      text: string;
    };
    unmergeCells?: {
      text: string;
    };
    deleteColumn?: {
      text: string;
    };
    deleteRow?: {
      text: string;
    };
    deleteTable?: {
      text: string;
    };
  };
  backgroundColors?: {
    colors?: string[];
    text?: string;
  };
  toolbarOptions?: {
    dialogRows?: number;
    dialogColumns?: number;
    i18n?: 'en' | 'zh';
  };
};

export type RectBoundary = {
  x: number;
  x1: number;
  y: number;
  y1: number;
  width: number;
  height: number;
};
