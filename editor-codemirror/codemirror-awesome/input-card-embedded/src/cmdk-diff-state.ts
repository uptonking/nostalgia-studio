import { invertedEffects } from '@codemirror/commands';
import {
  type EditorState,
  type StateEffect,
  StateField,
} from '@codemirror/state';
import type { CmdkDiffState } from './types';
import {
  showCmdkDiffView,
  hideCmdkDiffView,
  enableUndoCmdkTwice,
  enableRedoCmdkTwice,
  setIsDocUpdatedBeforeShowDiff,
  setIsCmdkDiffRejected,
  enableRedoCmdkThrice,
  enableUndoCmdkThrice,
  resetIsCmdkDiffRejected,
} from './cmdk-actions';

const initialCmdkDiffState: CmdkDiffState = {
  showCmdkDiff: false,
  isCmdkDiffRejected: -1,
  isDocUpdatedBeforeShowDiff: false,
  originalContent: '',
};

export const cmdkDiffState = StateField.define<CmdkDiffState>({
  create: () => initialCmdkDiffState,
  update(val, tr) {
    for (const ef of tr.effects) {
      if (ef.is(showCmdkDiffView) || ef.is(hideCmdkDiffView)) {
        val = { ...val, ...ef.value };
      }
      if (ef.is(setIsDocUpdatedBeforeShowDiff)) {
        val = { ...val, isDocUpdatedBeforeShowDiff: Boolean(ef.value) };
      }
      if (ef.is(setIsCmdkDiffRejected)) {
        val = { ...val, isCmdkDiffRejected: ef.value[0] };
      }
      if (ef.is(resetIsCmdkDiffRejected)) {
        val = { ...val, isCmdkDiffRejected: -1 };
      }
    }
    return val;
  },
});

export const invertCmdkDiff = invertedEffects.of((tr) => {
  const effects: StateEffect<unknown>[] = [];
  for (const ef of tr.effects) {
    if (ef.is(showCmdkDiffView)) {
      effects.push(
        hideCmdkDiffView.of({
          ...ef.value,
          showCmdkDiff: false,
        }),
      );
    }
    if (ef.is(hideCmdkDiffView)) {
      effects.push(
        showCmdkDiffView.of({
          ...ef.value,
          showCmdkDiff: true,
          showTypewriterAnimation: false,
        }),
      );
    }
    if (ef.is(setIsDocUpdatedBeforeShowDiff)) {
      effects.push(setIsDocUpdatedBeforeShowDiff.of(!Boolean(ef.value)));
    }
    if (ef.is(setIsCmdkDiffRejected)) {
      effects.push(setIsCmdkDiffRejected.of([ef.value[1], ef.value[0]]));
    }
  }
  return effects;
});

/** a hack approach to trigger undo/redo twice for some transaction
 * - default value is false, usually value is false; useful for cmdk undo/redo
 */
export const enableUndoRedoTwiceState = StateField.define<boolean>({
  create: () => false,
  update(val, tr) {
    for (const ef of tr.effects) {
      if (ef.is(enableUndoCmdkTwice) || ef.is(enableRedoCmdkTwice)) {
        val = Boolean(ef.value);
      }
    }
    return val;
  },
});

/** a hack approach to trigger undo/redo three times for some transaction */
export const enableUndoRedoThriceState = StateField.define<boolean>({
  create: () => false,
  update(val, tr) {
    for (const ef of tr.effects) {
      if (ef.is(enableUndoCmdkThrice) || ef.is(enableRedoCmdkThrice)) {
        val = Boolean(ef.value);
      }
    }
    return val;
  },
});

export function checkIsCmdkDiffVisibilityChanged(
  s1: EditorState,
  s2: EditorState,
) {
  return (
    s1.field(cmdkDiffState, false)?.showCmdkDiff !==
    s2.field(cmdkDiffState, false)?.showCmdkDiff
  );
}

export function checkIsDocUpdatedBeforeShowDiffChanged(
  s1: EditorState,
  s2: EditorState,
) {
  return (
    s1.field(cmdkDiffState, false)?.isDocUpdatedBeforeShowDiff !==
    s2.field(cmdkDiffState, false)?.isDocUpdatedBeforeShowDiff
  );
}

export function checkIsCmdkDiffRejectedChanged(
  s1: EditorState,
  s2: EditorState,
) {
  return (
    s1.field(cmdkDiffState, false)?.isCmdkDiffRejected !==
    s2.field(cmdkDiffState, false)?.isCmdkDiffRejected
  );
}

// window.diffst = (editView)=> editView.state.field(cmdkDiffState)