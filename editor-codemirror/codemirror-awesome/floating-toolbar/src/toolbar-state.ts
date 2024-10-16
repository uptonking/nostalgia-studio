import { type EditorState, StateField } from '@codemirror/state';

import {
  EditorView,
  type Tooltip,
  type TooltipView,
  showTooltip,
} from '@codemirror/view';
import { activePromptInput } from '../../input-card-embedded/src/prompt-input';
import { setShowFloatingToolbar } from './toolbar-actions';
import { hideToolbar, isAppleOs } from './utils';
import { isPromptInputActive } from '../../input-card-embedded/src/utils';
import { isAnimatableDiffViewActive } from '../../../src-pkgs/merge/src/utils';

function getToolbarItems(state: EditorState): readonly Tooltip[] {
  if (
    state.readOnly ||
    !state.facet(EditorView.editable) ||
    isPromptInputActive(state) ||
    isAnimatableDiffViewActive(state)
  ) {
    return [];
  }

  const cmd = isAppleOs() ? '⌘' : 'Ctrl';

  return state.selection.ranges
    .filter((range) => !range.empty)
    .map((range) => {
      const pos = range.head;
      const line = state.doc.lineAt(pos);
      let offset = pos - line.from;
      if (offset > 7) {
        offset = 7;
      }
      return {
        pos: range.head,
        above: true,
        arrow: false,
        create: (view: EditorView): TooltipView => {
          const root = document.createElement('div');
          root.className = 'cm-floating-toolbar-container';
          root.innerHTML = `
          <div class="cm-floating-toolbar">
            <div class="action-cmdk-edit cm-toolbar-item">
              <div class="action-text">Edit</div>
              <div class="action-text-secondary">${cmd}K</div>
            </div>
            <div class="cm-toolbar-item" style="display:none">
              <div class="action-text">Add to Chat</div>
              <div class="action-text-secondary">${cmd}⇧L</div>
            </div>
          </div>
            `;

          // console.log(';; bar ');

          root.onclick = (e) => {
            e.preventDefault();
          };

          const cmdkEditElem = root.querySelector(
            '.cm-floating-toolbar .action-cmdk-edit',
          ) as HTMLButtonElement;
          cmdkEditElem.onclick = (e) => {
            // console.log(';; cmdk2-bar ', state.selection.main);
            hideToolbar(view);
            activePromptInput(view, 'toolbar');
          };

          return {
            dom: root,
            offset: {
              x: -10 * offset,
              y: 4,
            },
          };
        },
      };
    });
}

export const floatingToolbarState = StateField.define<readonly Tooltip[]>({
  create: getToolbarItems,

  update(toolbar, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setShowFloatingToolbar)) {
        if (effect.value) {
          return getToolbarItems(tr.state);
        } else {
          return [];
        }
      }
    }
    return toolbar;
  },

  provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
});
