import { invertedEffects } from '@codemirror/commands';
import { StateField } from '@codemirror/state';
import type { CmdkDiffState } from './types';
import { showCmdkDiffView, hideCmdkDiffView } from './ext-parts';

const initialCmdkDiffState: CmdkDiffState = {
  showCmdkDiff: false,
  prompt: '',
  originalContent: '',
};

export const cmdkDiffState = StateField.define<CmdkDiffState>({
  create: () => initialCmdkDiffState,
  update(val, tr) {
    for (const ef of tr.effects) {
      if (ef.is(showCmdkDiffView)) {
        val = ef.value;
      }
    }
    return val;
  },
});

export const invertCmdkDiff = invertedEffects.of((tr) => {
  // for (let e of tr.effects) if (e.is(set)) return [set.of(tr.startState.field(field))]
  for (const ef of tr.effects) {
    if (ef.is(showCmdkDiffView)) {
      return [hideCmdkDiffView.of(ef.value)];
    }
    if (ef.is(hideCmdkDiffView)) {
      return [showCmdkDiffView.of(ef.value)];
    }
  }
  return [];
});
