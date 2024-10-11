import { invertedEffects } from '@codemirror/commands';
import { StateField } from '@codemirror/state';
import type { CmdkDiffState } from './types';
import {
  showCmdkDiffView,
  hideCmdkDiffView,
  enableUndoCmdkTwice,
  enableRedoCmdkTwice,
  setIsDocUpdatedBeforeShowDiff,
} from './cmdk-actions';

const initialCmdkDiffState: CmdkDiffState = {
  showCmdkDiff: false,
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
    }
    return val;
  },
});

export const invertCmdkDiff = invertedEffects.of((tr) => {
  for (const ef of tr.effects) {
    if (ef.is(showCmdkDiffView)) {
      return [
        hideCmdkDiffView.of({
          ...ef.value,
          showCmdkDiff: false,
        }),
      ];
    }
    if (ef.is(hideCmdkDiffView)) {
      return [
        showCmdkDiffView.of({
          ...ef.value,
          showCmdkDiff: true,
          showTypewriterAnimation: false,
        }),
      ];
    }
    if (ef.is(setIsDocUpdatedBeforeShowDiff)) {
      return [setIsDocUpdatedBeforeShowDiff.of(!Boolean(ef.value))];
    }
  }
  return [];
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
