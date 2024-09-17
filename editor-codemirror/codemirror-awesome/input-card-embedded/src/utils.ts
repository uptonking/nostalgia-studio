import type { EditorView } from '@codemirror/view';
import type { Pos } from './types';

export const PROMPT_TIPS_NORMAL = 'Esc to close, Enter to submit';
export const PROMPT_TIPS_REQUESTING = 'AI coding...';
export const PROMPT_PLACEHOLDER_NORMAL = 'Enter a prompt to modify code...';
export const PROMPT_PLACEHOLDER_ERROR =
  'Error occurred. Please try to regenerate or input another instruction.';

export function getRefContent(view: EditorView, pos: Pos) {
  return view.state.doc.sliceString(pos.from, pos.to);
}
