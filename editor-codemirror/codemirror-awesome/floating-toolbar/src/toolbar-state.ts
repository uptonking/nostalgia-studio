import { invertedEffects } from '@codemirror/commands';
import {
  type EditorState,
  type StateEffect,
  StateField,
} from '@codemirror/state';

import {
  EditorView,
  type Tooltip,
  keymap,
  showTooltip,
} from '@codemirror/view';
import { isAppleOs } from './utils';
import { enableTooltipEffect } from './toolbar-actions';

function getCursorTooltips(state: EditorState): readonly Tooltip[] {
  const cmd = isAppleOs() ? 'Command' : 'Ctrl';

  return state.selection.ranges
    .filter((range) => !range.empty)
    .map((range) => {
      const pos = range.head;
      const line = state.doc.lineAt(pos);
      let delta = pos - line.from;
      if (delta > 5) {
        delta = 5;
      }
      return {
        pos: range.head,
        above: true,
        create: () => {
          const dom = document.createElement('div');
          dom.className = 'cm-ai-tooltip-cursor';
          dom.innerHTML =
            // getAiWidgetOptions().tooltipHintElement ||
            `Press <code><b>${cmd}</b> + <b>k</b></code> to Edit`;
          return { dom, offset: { x: -16 * delta, y: 4 } };
        },
      };
    });
}

export const cursorTooltipField = StateField.define<readonly Tooltip[]>({
  create: getCursorTooltips,

  update(tooltips, tr) {
    for (const effect of tr.effects) {
      if (effect.is(enableTooltipEffect)) {
        if (effect.value) {
          return getCursorTooltips(tr.state);
        } else {
          return [];
        }
      }
    }
    return tooltips;
  },

  provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
});
