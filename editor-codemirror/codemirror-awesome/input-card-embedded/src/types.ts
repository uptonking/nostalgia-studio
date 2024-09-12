import type { EditorView } from '@codemirror/view';

export type ChatReq = {
  prompt: string;
  refContent: string;
  extra?: any;
};

export type ChatRes = {
  status: 'success' | 'error';
  message: string;
  extra?: any;
};

export type EventType =
  | 'widget.open' // {source: 'hotkey' | 'placeholder' | 'fix_sql_button' | ...}
  | 'req.send' // {chatReq}
  | 'req.cancel' // {chatReq}
  | 'req.success' // {chatReq, chatRes, duration}
  | 'req.error' // {chatReq, chatRes, duration}
  | 'accept.click' // {chatReq, chatRes}
  | 'discard.click' // {chatReq, chatRes}
  | 'gen.click' // {chatReq, chatRes}
  | 'close'; // {by: 'esc_key' | 'icon'}

export type InputWidgetOptions = {
  /* hotkey to trigger ai widget, default is 'Mod-K' */
  hotkey?: string;

  /* default: 'Fetching results...' */
  promptInputTipsRequesting?: string;
  /* default: 'Ask AI to write anything...' */
  promptInputPlaceholderNormal?: string;
  /* default: 'Error occurred. Please try to regenerate or input another instruction.' */
  // promptInputPlaceholderError?: string;
  /* prompt input configuration */
  /* default: 'AI results may be incorrect' */
  promptInputTipsNormal?: string;

  /* chat with AI */
  chat: (view: EditorView, chatId: string, req: ChatReq) => Promise<ChatRes>;
  cancelChat: (chatId: string) => void;

  /* event call, for telemetry if you need */
  onEvent?: (view: EditorView, type: EventType, payload?: {}) => void;
};
