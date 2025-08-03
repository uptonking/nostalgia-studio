import { EditorSelection } from '@codemirror/state';
import { EditorView, type Command, showDialog } from '@codemirror/view';

/// Command that shows a dialog asking the user for a line number, and
/// when a valid position is provided, moves the cursor to that line.
///
/// Supports line numbers, relative line offsets prefixed with `+` or
/// `-`, document percentages suffixed with `%`, and an optional
/// column position by adding `:` and a second number after the line
/// number.
export const gotoLine: Command = (view) => {
  const { state } = view;
  const line = String(state.doc.lineAt(view.state.selection.main.head).number);
  const { close, result } = showDialog(view, {
    label: state.phrase('Go to line'),
    input: { type: 'text', name: 'line', value: line },
    focus: true,
    submitLabel: state.phrase('go'),
  });
  result.then((form) => {
    const match =
      form &&
      /^([+-])?(\d+)?(:\d+)?(%)?$/.exec((form.elements as any)['line'].value);
    if (!match) {
      view.dispatch({ effects: close });
      return;
    }
    const startLine = state.doc.lineAt(state.selection.main.head);
    const [, sign, ln, cl, percent] = match;
    const col = cl ? Number(cl.slice(1)) : 0;
    let line = ln ? Number(ln) : startLine.number;
    if (ln && percent) {
      let pc = line / 100;
      if (sign)
        pc = pc * (sign == '-' ? -1 : 1) + startLine.number / state.doc.lines;
      line = Math.round(state.doc.lines * pc);
    } else if (ln && sign) {
      line = line * (sign == '-' ? -1 : 1) + startLine.number;
    }
    const docLine = state.doc.line(
      Math.max(1, Math.min(state.doc.lines, line)),
    );
    const selection = EditorSelection.cursor(
      docLine.from + Math.max(0, Math.min(col, docLine.length)),
    );
    view.dispatch({
      effects: [
        close,
        EditorView.scrollIntoView(selection.from, { y: 'center' }),
      ],
      selection,
    });
  });
  return true;
};
