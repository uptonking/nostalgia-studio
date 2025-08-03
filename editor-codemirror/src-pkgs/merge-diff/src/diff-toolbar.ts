import { floatingToolbarTheme } from '../../../codemirror-awesome/floating-toolbar/src/styling-theme';
import {
  type EditorState,
  type Extension,
  Prec,
  StateEffect,
  StateField,
} from '@codemirror/state';
import {
  EditorView,
  type Tooltip,
  type TooltipView,
  keymap,
  showTooltip,
} from '@codemirror/view';
import { isAnimatableDiffViewActive } from './utils';
import { ChunkField } from './merge';
import { ICON_UNDO } from './icons-svg';

function getToolbarItems(state: EditorState): readonly Tooltip[] {
  if (
    state.readOnly ||
    !state.facet(EditorView.editable) ||
    !isAnimatableDiffViewActive(state)
  ) {
    return [];
  }

  // const changedChunks = state.field(ChunkField, false);
  const changedChunks = [11];

  if (changedChunks.length > 0) {
    // const changes = changedChunks[0].changes;
    // console.log(';; changes ', changedChunks[0], changedChunks[0]);

    const toolbar: Tooltip = {
      pos: 22,
      above: true,
      arrow: false,
      create: (view: EditorView): TooltipView => {
        const root = document.createElement('div');
        root.className = 'cm-floating-toolbar-container';
        root.innerHTML = `
      <div class="cm-floating-toolbar" >
        <div class="action-regen cm-toolbar-item" style="display:none">
          <div class="action-text-secondary">ICON</div>
          <div class="action-text">Regenerate</div>
        </div>
        <div class="action-undo cm-toolbar-item" >
          <div class="action-text"> ${ICON_UNDO} </div>
          <div class="action-text">Undo</div>
        </div>
      </div>
        `;

        root.onclick = (e) => {
          e.preventDefault();
        };

        const cmdkEditElem = root.querySelector(
          '.cm-floating-toolbar .action-undo',
        ) as HTMLButtonElement;
        cmdkEditElem.onclick = (e) => {
          // console.log(';; bar-undo ', state.selection.main);
          hideToolbar(view);
          // activePromptInput(view, 'toolbar');
        };

        return {
          dom: root,
          offset: {
            // x: -10 * offset,
            x: 0,
            y: 4,
          },
        };
      },
    };

    return [toolbar];
  }

  return [];
}

const diffToolbarState = StateField.define<readonly Tooltip[]>({
  // create: getToolbarItems,
  create: () => [],

  update(tooltips, tr) {
    for (const ef of tr.effects) {
      if (ef.is(showDiffToolbar)) {
        if (ef.value) {
          return getToolbarItems(tr.state);
        } else {
          return [];
        }
      }
    }
    return tooltips;
  },

  provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
});

const showDiffToolbar = StateEffect.define<boolean>();

export function hideToolbar(view: EditorView) {
  view.dispatch({
    effects: showDiffToolbar.of(false),
  });
}

const diffToolbarTrigger = () => {
  return EditorView.updateListener.of((update) => {
    // if (!update.selectionSet) return;

    if (!isAnimatableDiffViewActive(update.view.state)) return;

    // const { from, to } = update.view.state.selection.main;
    // if (from === to) {
    //   hideToolbar(update.view);
    //   return;
    // }

    update.view.dispatch({
      effects: showDiffToolbar.of(true),
    });
  });
};

export function diffToolbar(): Extension {
  return [floatingToolbarTheme, diffToolbarState, diffToolbarTrigger()];
}
