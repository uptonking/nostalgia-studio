import {
  StateEffect,
  StateField,
  Compartment,
  type EditorState,
} from '@codemirror/state';

export type DiffPlayState = {
  /** current line number of changed-chunks being played, start from 0 */
  playLineNumber: number;
  /** todo support to pause diff animation */
  isDiffPaused: boolean;
  /** to reduce unnecessary computation of chunksByLine, before lines count is known
   * - because playLineNumber isn't aware of the total lines count
   */
  isDiffCompleted: boolean;
};

const initialDiffPlayState: DiffPlayState = {
  playLineNumber: -10,
  isDiffPaused: false,
  isDiffCompleted: false,
};

export const resetDiffPlayState = StateEffect.define<undefined>();
/** add 1 after scrolled to next line */
export const autoPlayDiffEffect = StateEffect.define<number>();
export const setIsDiffCompleted = StateEffect.define<boolean>();
// export const setDiffPlayLineNumber = StateEffect.define<number | undefined>();
export const pauseDiffEffect = StateEffect.define<boolean>();

/** take effect only if `showTypewriterAnimation` is true
 * - <0 means not showing animation
 */
export const diffPlayControllerState = StateField.define<DiffPlayState>({
  create() {
    return initialDiffPlayState;
  },

  update(value, tr) {
    let playState = { ...value };
    for (const effect of tr.effects) {
      if (effect.is(autoPlayDiffEffect)) {
        playState = {
          ...playState,
          playLineNumber:
            playState.playLineNumber < 0 ? 0 : ++playState.playLineNumber,
        };
      }
      // if (effect.is(setDiffPlayLineNumber)) {
      //   currentLineNumber = {
      //     ...currentLineNumber,
      //     playLineNumber: effect.value || -10,
      //   };
      // }
      if (effect.is(setIsDiffCompleted)) {
        playState = {
          ...playState,
          isDiffCompleted: Boolean(effect.value),
        };
      }
      if (effect.is(resetDiffPlayState)) {
        playState = initialDiffPlayState;
      }
    }
    // console.log(
    //   ';; no.-done ',
    //   playState.playLineNumber,
    //   playState.isDiffCompleted,
    // );
    return playState;
  },
});

export function diffPlayStateChanged(s1: EditorState, s2: EditorState) {
  return (
    s1.field(diffPlayControllerState, false)?.playLineNumber !==
      s2.field(diffPlayControllerState, false)?.playLineNumber ||
    s1.field(diffPlayControllerState, false)?.isDiffCompleted !==
      s2.field(diffPlayControllerState, false)?.isDiffCompleted
  );
}
