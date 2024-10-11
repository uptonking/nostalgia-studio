import { invertedEffects } from '@codemirror/commands';
import { StateField } from '@codemirror/state';
import type { CmdkInputState } from './types';
import {
  showCmdkInput,
  hideCmdkInput,
} from './cmdk-actions';

const initialCmdkInputState: CmdkInputState = {
  showCmdkInputCard: false,
  prompt: '',
  lastPrompt: '',
  promptPos: { from: -1000, to: -1000 },
};

export const cmdkInputState = StateField.define<CmdkInputState>({
  create: () => initialCmdkInputState,
  update(val, tr) {
    for (const ef of tr.effects) {
      if (ef.is(showCmdkInput) || ef.is(hideCmdkInput)) {
        val = { ...val, ...ef.value };
      }
      // if (ef.is(setIsDocUpdatedBeforeShowDiff)) {
      //   val = { ...val, isDocUpdatedBeforeShowDiff: Boolean(ef.value) };
      // }
    }
    return val;
  },
});

export const invertCmdkInput = invertedEffects.of((tr) => {
  for (const ef of tr.effects) {
    if (ef.is(showCmdkInput)) {
      return [
        hideCmdkInput.of({
          ...ef.value,
          showCmdkInputCard: false,
        }),
      ];
    }
    if (ef.is(hideCmdkInput)) {
      return [
        showCmdkInput.of({
          ...ef.value,
          showCmdkInputCard: true,
        }),
      ];
    }
    // if (ef.is(setIsDocUpdatedBeforeShowDiff)) {
    //   return [setIsDocUpdatedBeforeShowDiff.of(!Boolean(ef.value))];
    // }
  }
  return [];
});

/** a hack approach to trigger undo/redo twice for some transaction
 * - default value is false, usually value is false; useful for cmdk undo/redo
 */
// export const enableUndoRedoTwiceState = StateField.define<boolean>({
//   create: () => false,
//   update(val, tr) {
//     for (const ef of tr.effects) {
//       if (ef.is(enableUndoCmdkTwice) || ef.is(enableRedoCmdkTwice)) {
//         val = Boolean(ef.value);
//       }
//     }
//     return val;
//   },
// });
