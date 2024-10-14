import { ViewPlugin, type EditorView } from '@codemirror/view';
import type { Pos } from './types';
import type { EditorState, Extension, Transaction } from '@codemirror/state';
import {
  inputWidgetPluginCompartment,
  cmdkDiffViewCompartment,
  enableUndoCmdkTwice,
  enableRedoCmdkTwice,
} from './cmdk-actions';
import { enableUndoRedoTwiceState } from './cmdk-diff-state';
import { undo, redo } from '@codemirror/commands';

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

export function isCmdkDiffViewActive(state: EditorState) {
  const diffViewExt = cmdkDiffViewCompartment.get(state);
  if (Array.isArray(diffViewExt)) {
    return diffViewExt.length > 0;
  }
  return false;
}

export function cmdkUndo(view: EditorView) {
  queueMicrotask(() => {
    const undoTwiceState = view.state.field(enableUndoRedoTwiceState, false);
    if (undoTwiceState) {
      console.log(';; k-undo-twice ', undoTwiceState);
      undo(view);
      view.dispatch({ effects: [enableUndoCmdkTwice.of(false)] });
    }
  });

  return false;
}

export function cmdkRedo(view: EditorView) {
  queueMicrotask(() => {
    const redoTwiceState = view.state.field(enableUndoRedoTwiceState, false);
    if (redoTwiceState) {
      console.log(';; k-redo-twice ', redoTwiceState);
      redo(view);
      view.dispatch({ effects: [enableRedoCmdkTwice.of(false)] });
    }
  });

  return false;
}

export function queryMainElements() {
  const root = document.querySelector(
    '.cm-ai-prompt-input-root',
  ) as HTMLDivElement;
  const promptInputBox = root.querySelector(
    '.prompt-input-box',
  ) as HTMLInputElement;
  const tips = root.querySelector(
    '.cm-ai-prompt-input-tips',
  ) as HTMLSpanElement;
  const actionBtns = root.querySelector(
    '.cm-ai-prompt-input-actions',
  ) as HTMLDivElement;

  return {
    root,
    tips,
    actionBtns,
    promptInputBox,
  };
}
