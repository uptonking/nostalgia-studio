import type { EditorView } from '@codemirror/view';

export type Pos = { from: number; to: number };

export type InputWidgetOptions = {
  /* hotkey to trigger this input widget, default is 'Mod-K' */
  hotkey?: string;
};
