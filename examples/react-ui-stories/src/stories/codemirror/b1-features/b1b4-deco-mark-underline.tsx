import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { Decoration, type DecorationSet, keymap } from '@codemirror/view';
import { StateField, StateEffect, Compartment } from '@codemirror/state';

const underlineTheme = EditorView.baseTheme({
  '.cm-underline': { textDecoration: 'underline 3px tomato' },
});

const underlineMark = Decoration.mark({ class: 'cm-underline' });

const addUnderline = StateEffect.define<{ from: number; to: number }>({
  map: ({ from, to }, change) => ({
    from: change.mapPos(from),
    to: change.mapPos(to),
  }),
});

const underlineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(underlines, tr) {
    underlines = underlines.map(tr.changes);
    for (const e of tr.effects)
      if (e.is(addUnderline)) {
        underlines = underlines.update({
          add: [underlineMark.range(e.value.from, e.value.to)],
        });
      }
    return underlines;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export function underlineSelectionCmd(view: EditorView) {
  const effects: StateEffect<unknown>[] = view.state.selection.ranges
    .filter((r) => !r.empty)
    .map(({ from, to }) => addUnderline.of({ from, to }));
  if (!effects.length) return false;

  if (!view.state.field(underlineField, false))
    effects.push(StateEffect.appendConfig.of([underlineField, underlineTheme]));
  view.dispatch({ effects });
  return true;
}

export const underlineKeymap = keymap.of([
  {
    key: 'Mod-h',
    preventDefault: true,
    run: underlineSelectionCmd,
  },
]);

export const DecoMarkUnderline = () => {
  const content = `
Select text and press Ctrl-h (Cmd-h) to add an underline to it.

# CodeMirror v6

This is an cm example at 20240806

## Lists

- apple
- banana
- another fruit

## Links

[Some Link](https://example.org)
`;

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      // extensions: [basicSetup, language.of(markdown())],
      // extensions: [underlineKeymap, basicSetup],
      extensions: [basicSetup, underlineKeymap],
      doc: content,
      parent: editorRef.current,
    });
    window['edd'] = editor;

    return () => {
      editor.destroy();
      window['edd'] = undefined;
    };
  }, [content]);

  return (
    <div className='idCMEditor'>
      <div ref={editorRef} />
    </div>
  );
};
