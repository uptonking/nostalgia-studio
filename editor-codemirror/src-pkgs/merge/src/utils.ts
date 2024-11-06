import type { EditorState } from '@codemirror/state';
import { animatableDiffViewCompartment } from './diff-actions';
import { Decoration } from '@codemirror/view';

export const TOTAL_TYPEWRITER_DURATION_PER_DIFF_VIEW = 5000;
export const MIN_TYPEWRITER_DURATION_PER_LINE = 50;

// const changedLineDeco = Decoration.line({
const changedLineDeco = (lineCharsCount = 16) =>
  Decoration.line({
    // class: 'cm-changedLine',
    class: 'cm-changedLine cm-line-typing',
    attributes: { style: `--lineCharsCount:${lineCharsCount}` },
  });
const changedLineDiffOffDeco = Decoration.line({
  class: 'cm-changedLine anime-diff-off',
});
const changedLineHiddenDeco = Decoration.line({
  class: 'cm-changedLine cm-line-hidden',
});
const changedLineTypewriterDeco = Decoration.line({
  class: 'cm-changedLine cm-line-typing',
});
const changedLineTypewriterDiffOffDeco = Decoration.line({
  class: 'cm-changedLine anime-diff-off cm-line-typing',
});

export function getChangedLineDeco(
  displayStatus: 'show' | 'typing' | 'hidden',
  lineDuration = MIN_TYPEWRITER_DURATION_PER_LINE,
  showAnimeWithDiffOff = false,
) {
  if (displayStatus === 'hidden') return changedLineHiddenDeco;
  if (
    displayStatus === 'typing' &&
    lineDuration >= MIN_TYPEWRITER_DURATION_PER_LINE * 2
  ) {
    return showAnimeWithDiffOff
      ? changedLineTypewriterDiffOffDeco
      : changedLineTypewriterDeco;
  }
  return showAnimeWithDiffOff ? changedLineDiffOffDeco : changedLineDeco();
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
