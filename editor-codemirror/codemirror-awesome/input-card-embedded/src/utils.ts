import { ViewPlugin, type EditorView } from '@codemirror/view';
import type { Pos } from './types';
import type { EditorState } from '@codemirror/state';
import {
  inputWidgetPluginCompartment,
  cmdkDiffViewCompartment,
  enableUndoCmdkTwice,
  enableRedoCmdkTwice,
  enableRedoCmdkThrice,
  enableUndoCmdkThrice,
} from './cmdk-actions';
import {
  enableUndoRedoThriceState,
  enableUndoRedoTwiceState,
} from './cmdk-diff-state';
import { undo, redo } from '@codemirror/commands';

export const PROMPT_TIPS_NORMAL = 'Esc to close, Enter to submit';
export const PROMPT_TIPS_REQUESTING = 'AI coding...';
export const PROMPT_PLACEHOLDER_NORMAL = 'Enter a prompt to modify code...';
export const PROMPT_PLACEHOLDER_ERROR =
  'Error occurred. Please try to regenerate or input another instruction.';

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

export function getRefContent(view: EditorView, pos: Pos) {
  return view.state.doc.sliceString(pos.from, pos.to);
}

export function acceptCmdkCode(view: EditorView) {
  if (isCmdkDiffViewActive(view.state)) {
    const acceptBtn = document.querySelector(
      'button#cm-ai-prompt-btn-accept',
    ) as HTMLButtonElement;
    if (acceptBtn) {
      acceptBtn.click();
      // console.log(';; ac-true ');
      return true;
    }
  }
  // console.log(';; ac-false ');
  return false;
}

export function rejectCmdkCode(view: EditorView) {
  if (isCmdkDiffViewActive(view.state)) {
    const rejectBtn = document.querySelector(
      'button#cm-ai-prompt-btn-discard',
    ) as HTMLButtonElement;
    if (rejectBtn) {
      rejectBtn.click();
      // console.log(';; rj-true ');
      return true;
    }
  }
  // console.log(';; rj-false ');
  return false;
}

export function cmdkUndo(view: EditorView) {
  queueMicrotask(() => {
    const undoTwiceState = view.state.field(enableUndoRedoTwiceState, false);
    if (undoTwiceState) {
      console.log(';; k-undo2 ', undoTwiceState);
      undo(view);
      view.dispatch({ effects: [enableUndoCmdkTwice.of(false)] });
    }
    const undoThriceState = view.state.field(enableUndoRedoThriceState, false);
    if (undoThriceState) {
      console.log(';; k-undo3 ', undoThriceState);
      undo(view);
      undo(view);
      undo(view);
      view.dispatch({ effects: [enableUndoCmdkThrice.of(false)] });
    }
  });

  return false;
}

export function cmdkRedo(view: EditorView) {
  queueMicrotask(() => {
    const redoTwiceState = view.state.field(enableUndoRedoTwiceState, false);
    if (redoTwiceState) {
      console.log(';; k-redo2 ', redoTwiceState);
      redo(view);
      view.dispatch({ effects: [enableRedoCmdkTwice.of(false)] });
    }
    const redoThriceState = view.state.field(enableUndoRedoThriceState, false);
    if (redoThriceState) {
      console.log(';; k-redo3 ', redoThriceState);
      redo(view);
      redo(view);
      redo(view);
      view.dispatch({ effects: [enableRedoCmdkThrice.of(false)] });
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
