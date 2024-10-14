import { inputWidgetPluginCompartment } from './../../input-card-embedded/src/cmdk-actions';
import { Prec, type Extension } from '@codemirror/state';
import { keymap, EditorView, ViewPlugin } from '@codemirror/view';
import { cursorTooltipBaseTheme } from './styling-theme';
import { enableTooltipEffect } from './toolbar-actions';
import { cursorTooltipField } from './toolbar-state';
import { hideTooltip } from './utils';

// dismiss tooltip when press ai-widget hotkey (default is 'Mod-i')
const hideTooltipKeymap = (hotkey?: string) =>
  Prec.highest(
    keymap.of([
      {
        key: hotkey || 'Mod-k',
        run: (view) => {
          if (view.state.field(cursorTooltipField).length !== 0) {
            hideTooltip(view);
          }
          return false;
        },
      },
    ]),
  );

const selectionChangeListener = () => {
  let timer: number | undefined;
  let preFrom = -1;
  let preTo = -1;

  return EditorView.updateListener.of((update) => {
    if (!update.selectionSet) return;

    const { from, to } = update.view.state.selection.main;
    if (from === preFrom && to === preTo) return;
    preFrom = from;
    preTo = to;

    // dismiss the previous tooltip immediately
    if (from === to) {
      hideTooltip(update.view);
      return;
    }

    // debounce
    timer && clearTimeout(timer);
    // delay to show the tooltip
    timer = window.setTimeout(() => {
      if (
        inputWidgetPluginCompartment.get(update.view.state) instanceof
        ViewPlugin
      )
        return;
      // if (!getFirstNonUseTypeStatement(update.view.state)) return

      update.view.dispatch({
        effects: enableTooltipEffect.of(true),
      });
    }, 500);
  });
};

export function aiCursorTooltip(hotkey?: string): Extension {
  return [
    cursorTooltipBaseTheme,
    hideTooltipKeymap(hotkey),
    cursorTooltipField,
    selectionChangeListener(),
  ];
}
