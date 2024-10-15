import { Prec, type Extension } from '@codemirror/state';
import { EditorView, keymap, ViewPlugin } from '@codemirror/view';
import { cmdkInputState } from '../../input-card-embedded/src/cmdk-input-state';
import { inputWidgetPluginCompartment } from './../../input-card-embedded/src/cmdk-actions';
import { floatingToolbarTheme } from './styling-theme';
import { setShowFloatingToolbar } from './toolbar-actions';
import { floatingToolbarState } from './toolbar-state';
import { hideToolbar } from './utils';

/** dismiss toolbar when press ai input hotkey (default is 'Mod-k') */
const hideToolbarHotkeys = (hotkey?: string) =>
  Prec.highest(
    keymap.of([
      {
        key: hotkey || 'Mod-k',
        run: (view) => {
          if (view.state.field(floatingToolbarState).length !== 0) {
            hideToolbar(view);
          }
          return false;
        },
      },
    ]),
  );

/** show or hide floating toolbar */
const floatingToolbarTrigger = () => {
  let timer: number | undefined;
  let prevFrom = -1;
  let prevTo = -1;

  return EditorView.updateListener.of((update) => {
    if (!update.selectionSet) return;

    const { from, to } = update.view.state.selection.main;
    const isSelectionUnchanged = from === prevFrom && to === prevTo;
    if (isSelectionUnchanged) return;
    prevFrom = from;
    prevTo = to;

    if (
      from === to ||
      update.state.field(cmdkInputState, false).showCmdkInputCard
    ) {
      hideToolbar(update.view);
      return;
    }

    if (timer) clearTimeout(timer);
    // delay to show the toolbar
    timer = window.setTimeout(() => {
      if (
        inputWidgetPluginCompartment.get(update.view.state) instanceof
        ViewPlugin
      ) {
        return;
      }

      update.view.dispatch({
        effects: setShowFloatingToolbar.of(true),
      });
    }, 500);
  });
};

export function floatingToolbar(hotkey?: string): Extension {
  return [
    floatingToolbarTheme,
    floatingToolbarState,
    hideToolbarHotkeys(hotkey),
    floatingToolbarTrigger(),
  ];
}
