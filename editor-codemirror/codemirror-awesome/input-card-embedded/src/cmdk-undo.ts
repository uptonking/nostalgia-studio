import { Prec } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { historyField } from '@codemirror/commands';

export const cmdkUndo = (hotkey?: string) => {
  return Prec.high(
    keymap.of([
      {
        key: hotkey || 'Mod-z',
        run: (view) => {
          // activePromptInput(view);
          console.log(';; k-cmd-z');
          const history = view.state.field(historyField);
          console.log(history);

          return false;
          // return true;
        },
      },
    ]),
  );
};
