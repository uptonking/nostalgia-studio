import { ViewPlugin, type EditorView } from '@codemirror/view';
import type { Pos } from './types';
import type { EditorState, Extension } from '@codemirror/state';
import {
  inputWidgetPluginCompartment,
  animeDiffViewCompartment,
} from './ext-parts';

export const PROMPT_TIPS_NORMAL = 'Esc to close, Enter to submit';
export const PROMPT_TIPS_REQUESTING = 'AI coding...';
export const PROMPT_PLACEHOLDER_NORMAL = 'Enter a prompt to modify code...';
export const PROMPT_PLACEHOLDER_ERROR =
  'Error occurred. Please try to regenerate or input another instruction.';

export function getRefContent(view: EditorView, pos: Pos) {
  return view.state.doc.sliceString(pos.from, pos.to);
}

export function isPromptInputActive(state: EditorState) {
  return inputWidgetPluginCompartment.get(state) instanceof ViewPlugin;
}

export function isAnimeDiffViewActive(state: EditorState) {
  const diffViewExt = animeDiffViewCompartment.get(state);
  if (diffViewExt) {
    return (diffViewExt as Extension[]).length > 0;
  }
  return false;
}
