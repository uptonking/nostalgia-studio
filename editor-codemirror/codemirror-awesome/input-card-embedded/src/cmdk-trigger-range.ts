import { Decoration, EditorView } from '@codemirror/view';
import { cmdkInputState } from './cmdk-input-state';
import { isCmdkDiffViewActive } from './utils';
import { cmdkDiffState } from './cmdk-diff-state';

const highlightedTriggerRangeDeco = Decoration.mark({
  class: 'cmdk-trigger-range',
});

/**
 * highlight the selection range when cmdk input is triggered to show
 * - when input shows, if the range is cursor(from===to), the whole line will be highlighted
 */
export const cmdkTriggerRange = () =>
  EditorView.decorations.compute([cmdkInputState, cmdkDiffState], (state) => {
    const inputState = state.field(cmdkInputState, false);
    const diffState = state.field(cmdkDiffState, false);
    if (
      state.readOnly ||
      !inputState.showCmdkInputCard ||
      diffState.showCmdkDiff ||
      isCmdkDiffViewActive(state)
    ) {
      return Decoration.none;
    }

    const triggerRange = inputState.inputTriggerRange;
    if (triggerRange[0] < 0) return Decoration.none;

    let [highlightFrom, highlightTo] = triggerRange;

    console.log(
      ';; range-highlight ',
      inputState,
      state.doc.lineAt(highlightFrom),
    );

    if (highlightFrom === highlightTo) {
      const lineRange = state.doc.lineAt(highlightFrom);
      if (lineRange.from === lineRange.to) return Decoration.none;
      highlightFrom = lineRange.from;
      highlightTo = lineRange.to;
    }

    return Decoration.set(
      highlightedTriggerRangeDeco.range(highlightFrom, highlightTo),
    );
  });
