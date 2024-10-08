import type { EditorView } from '@codemirror/view';

export type CmdkDiffState = {
  /** whether cmdk diff view is visible, default is false */
  showCmdkDiff: boolean;
  /** prompt text from cmdk input */
  prompt: string;
  /** original content for cmdk diff view */
  originalContent: string;
};

export type Pos = { from: number; to: number };

export type ChatReq = {
  prompt: string;
  refContent: string;
  extra?: Record<string, any>;
};

export type ChatRes = {
  status: 'success' | 'error';
  /** message can be undefined when status is error */
  message: string;
  extra?: Record<string, any>;
};

export type EventType =
  | 'widget.open' // {source: 'hotkey' | 'toolbar_button' | ...}
  | 'req.send' // {chatReq}
  | 'req.cancel' // {chatReq}
  | 'req.success' // {chatReq, chatRes, duration}
  | 'req.error' // {chatReq, chatRes, duration}
  | 'accept.click' // {chatReq, chatRes}
  | 'discard.click' // {chatReq, chatRes}
  | 'gen.click' // {chatReq, chatRes}
  | 'close'; // {by: 'esc_key' | 'icon'}

export type InputWidgetOptions = {
  /* hotkey to trigger this input widget, default is 'Mod-K' */
  hotkey?: string;

  /* default prompt input tips; below input */
  promptInputTipsNormal?: string;
  /* loading indication text when ai is coding; below input */
  promptInputTipsRequesting?: string;
  /* default placeholder text; inside input */
  promptInputPlaceholderNormal?: string;
  /* error text; inside input */
  promptInputPlaceholderError?: string;

  /* chat with AI to get code from agent */
  chat: (view: EditorView, chatId: string, req: ChatReq) => Promise<ChatRes>;
  cancelChat?: (chatId: string) => void;

  /* event call, for telemetry or custom events after input widget showing */
  onEvent?: (
    view: EditorView,
    type: EventType,
    payload?: Record<string, any>,
  ) => void;
};
