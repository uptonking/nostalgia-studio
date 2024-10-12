import { invertedEffects } from '@codemirror/commands';
import { StateField } from '@codemirror/state';
import type { CmdkInputState } from './types';
import {
  showCmdkInput,
  hideCmdkInput,
  setIsPromptInputFocused,
  setPromptText,
} from './cmdk-actions';

const initialCmdkInputState: CmdkInputState = {
  showCmdkInputCard: false,
  isPromptInputFocused: false,
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
      if (ef.is(setIsPromptInputFocused)) {
        val = { ...val, isPromptInputFocused: Boolean(ef.value) };
      }
      if (ef.is(setPromptText)) {
        val = { ...val, prompt: ef.value[0] };
      }
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
    if (
      ef.is(setPromptText) &&
      Array.isArray(ef.value) &&
      ef.value.length === 2
    ) {
      return [setPromptText.of([ef.value[1], ef.value[0]])];
    }
  }
  return [];
});

