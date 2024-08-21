import { StateEffect, StateField, Compartment, type EditorState } from '@codemirror/state';

export const pauseDiffEffect = StateEffect.define<boolean>();
export const autoPlayDiffEffect = StateEffect.define<number | undefined>();

/** take effect only if `showTypewriterAnimation` is true
 * - <0 means not showing animation
 */
export const diffPlayControllerState = StateField.define({
  create() {
    return {
      playLineNumber: -10,
      isDiffPaused: false,
    };
  },

  update(value, tr) {
    let currentLineNumber = { ...value };
    // console.log(';; no. ', currentLineNumber.playLineNumber);
    if (value.playLineNumber === undefined || value.playLineNumber < 0) {
      currentLineNumber.playLineNumber = 0;
    }
    for (const effect of tr.effects) {
      if (effect.is(autoPlayDiffEffect)) {
        currentLineNumber = {
          ...currentLineNumber,
          playLineNumber: ++currentLineNumber.playLineNumber,
        };
      }
    }
    return currentLineNumber;
  },
});

export function diffPlayLineNumberChanged(s1: EditorState, s2: EditorState) {
  return s1.field(diffPlayControllerState, false).playLineNumber != s2.field(diffPlayControllerState, false).playLineNumber;
}