import type { EditorState } from '@codemirror/state';
import { animatableDiffViewCompartment } from './diff-actions';
import { Decoration } from '@codemirror/view';

export const TOTAL_TYPEWRITER_DURATION_PER_DIFF_VIEW = 2000;
export const MIN_TYPEWRITER_DURATION_PER_LINE = 40;

const changedLineDeco = Decoration.line({
  class: 'cm-changedLine',
});
const changedLineDiffOffDeco = Decoration.line({
  class: 'cm-changedLine anime-diff-off',
});
const changedLineHiddenDeco = Decoration.line({
  class: 'cm-changedLine cm-line-hidden',
});

const changedLineTypewriterDeco = Decoration.line({
  // class: 'cm-changedLine cm-line-typing',
  class: 'cm-changedLine',
});
const changedLineTypewriterDiffOffDeco = Decoration.line({
  // class: 'cm-changedLine anime-diff-off cm-line-typing',
  class: 'cm-changedLine anime-diff-off ',
});

export function getChangedLineDeco(
  displayStatus: 'show' | 'typing' | 'hidden',
  showAnimeWithDiffOff = false,
  // lineDuration = MIN_TYPEWRITER_DURATION_PER_LINE,
) {
  if (displayStatus === 'hidden') return changedLineHiddenDeco;
  // if (
  //   displayStatus === 'typing' &&
  //   lineDuration >= MIN_TYPEWRITER_DURATION_PER_LINE * 2
  // ) {
  //   return showAnimeWithDiffOff
  //     ? changedLineTypewriterDiffOffDeco
  //     : changedLineTypewriterDeco;
  // }
  return showAnimeWithDiffOff ? changedLineDiffOffDeco : changedLineDeco;
}

export function getInsertedDeco(
  displayStatus: 'show' | 'typing' | 'hidden',
  lineCharsCount = 16,
  lineDuration = MIN_TYPEWRITER_DURATION_PER_LINE,
) {
  return Decoration.mark(
    displayStatus === 'typing' && lineDuration >= MIN_TYPEWRITER_DURATION_PER_LINE * 2
      ? {
          tagName: 'ins',
          class: 'cm-insertedLine-typing',
          attributes: { style: `--lineCharsCount:${lineCharsCount}` },
        }
      : {
          tagName: 'ins',
          class: 'cm-insertedLine',
        },
  );
}

export function isAnimatableDiffViewActive(state: EditorState) {
  const diffViewExt = animatableDiffViewCompartment.get(state);
  if (Array.isArray(diffViewExt)) {
    return diffViewExt.length > 0;
  }
  return false;
}

/**
 * get typewriter animation duration for one single line
 * - if intervalDurationPerLine is less than minDuration, minDuration will be returned for ux reasons
 */
export function getIntervalDurationPerLine(
  linesCount: number,
  totalDuration = TOTAL_TYPEWRITER_DURATION_PER_DIFF_VIEW,
  minDuration = MIN_TYPEWRITER_DURATION_PER_LINE,
) {
  let intervalDurationPerLine = Math.ceil(totalDuration / linesCount);
  if (intervalDurationPerLine < minDuration) {
    intervalDurationPerLine = minDuration;
  }
  return intervalDurationPerLine;
}
