import {
  StateEffect,
  StateField,
  Compartment,
  type EditorState,
} from '@codemirror/state';

export const pauseDiffEffect = StateEffect.define<boolean>();
export const autoPlayDiffEffect = StateEffect.define<number | undefined>();
export const setIsDiffCompleted = StateEffect.define<boolean>();

/** take effect only if `showTypewriterAnimation` is true
 * - <0 means not showing animation
 */
export const diffPlayControllerState = StateField.define({
  create() {
    return {
      playLineNumber: -10,
      /** todo support pause */
      isDiffPaused: false,
      /** to reduce unnecessary computation of chunksByLine, before lines count is known
       * - because playLineNumber isn't aware of the total lines count
       */
      isDiffCompleted: false,
    };
  },

  update(value, tr) {
    let currentLineNumber = { ...value };
    for (const effect of tr.effects) {
      if (effect.is(autoPlayDiffEffect)) {
        currentLineNumber = {
          ...currentLineNumber,
          playLineNumber:
            currentLineNumber.playLineNumber < 0
              ? 0
              : ++currentLineNumber.playLineNumber,
        };
      }
      if (effect.is(setIsDiffCompleted)) {
        currentLineNumber = {
          ...currentLineNumber,
          isDiffCompleted: Boolean(effect.value),
        };
      }
    }
    // console.log(
    //   ';; no.-done ',
    //   currentLineNumber.playLineNumber,
    //   currentLineNumber.isDiffCompleted,
    // );
    return currentLineNumber;
  },
});

export function diffPlayStateChanged(s1: EditorState, s2: EditorState) {
  return (
    s1.field(diffPlayControllerState, false).playLineNumber !==
      s2.field(diffPlayControllerState, false).playLineNumber ||
    s1.field(diffPlayControllerState, false).isDiffCompleted !==
      s2.field(diffPlayControllerState, false).isDiffCompleted
  );
}