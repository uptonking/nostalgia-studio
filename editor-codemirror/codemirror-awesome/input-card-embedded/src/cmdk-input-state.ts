import { invertedEffects } from '@codemirror/commands';
import {
  type EditorState,
  type StateEffect,
  StateField,
} from '@codemirror/state';
import type { CmdkInputState } from './types';
import {
  showCmdkInput,
  hideCmdkInput,
  setIsPromptInputFocused,
  setPromptText,
  setInputTriggerRange,
} from './cmdk-actions';

const initialCmdkInputState: CmdkInputState = {
  showCmdkInputCard: false,
  inputTriggerRange: [-1e9, -1e9],
  isPromptInputFocused: false,
  prompt: '',
  lastPrompt: '',
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
      if (ef.is(setInputTriggerRange)) {
        val = { ...val, inputTriggerRange: ef.value[0] };
      }
    }
    return val;
  },
});

export const invertCmdkInput = invertedEffects.of((tr) => {
  const effects: StateEffect<unknown>[] = [];
  for (const ef of tr.effects) {
    if (ef.is(showCmdkInput)) {
      effects.push(
        hideCmdkInput.of({
          ...ef.value,
          showCmdkInputCard: false,
        }),
      );
    }
    if (ef.is(hideCmdkInput)) {
      effects.push(
        showCmdkInput.of({
          ...ef.value,
          showCmdkInputCard: true,
        }),
      );
    }
    if (
      ef.is(setPromptText) &&
      Array.isArray(ef.value) &&
      ef.value.length === 2
    ) {
      effects.push(setPromptText.of([ef.value[1], ef.value[0]]));
    }
    if (
      ef.is(setInputTriggerRange) &&
      Array.isArray(ef.value) &&
      ef.value.length === 2
    ) {
      effects.push(setInputTriggerRange.of([ef.value[1], ef.value[0]]));
    }
  }
  return effects;
});

export function checkIsCmdkInputVisibilityChanged(
  s1: EditorState,
  s2: EditorState,
) {
  return (
    s1.field(cmdkInputState, false)?.showCmdkInputCard !==
    s2.field(cmdkInputState, false)?.showCmdkInputCard
  );
}

// window.inpst = (editView) => editView.state.field(cmdkInputState);
