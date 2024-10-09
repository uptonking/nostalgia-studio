import { historyField, invertedEffects } from '@codemirror/commands';
import { Prec, StateField } from '@codemirror/state';
import type { CmdkDiffState } from './types';
import { showCmdkDiffView, hideCmdkDiffView } from './ext-parts';
import { keymap } from '@codemirror/view';

const initialCmdkDiffState: CmdkDiffState = {
  showCmdkDiff: false,
  prompt: '',
  originalContent: '',
};

export const cmdkDiffState = StateField.define<CmdkDiffState>({
  create: () => initialCmdkDiffState,
  update(val, tr) {
    for (const ef of tr.effects) {
      if (ef.is(showCmdkDiffView) || ef.is(hideCmdkDiffView)) {
        val = { ...val, ...ef.value };
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
  }
  return [];
});

