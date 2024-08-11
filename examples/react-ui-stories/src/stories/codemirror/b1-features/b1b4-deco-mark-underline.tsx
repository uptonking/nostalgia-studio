import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { Decoration, type DecorationSet, keymap } from '@codemirror/view';
import { StateField, StateEffect, Compartment } from '@codemirror/state';

const underlineTheme = EditorView.baseTheme({
  '.cm-underline': { textDecoration: 'underline 3px tomato' },
});

const underlineMarkDeco = Decoration.mark({ class: 'cm-underline' });

const addUnderline = StateEffect.define<{ from: number; to: number }>({
  map: ({ from, to }, change) => ({
    from: change.mapPos(from),
    to: change.mapPos(to),
  }),
});

const underlineState = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(underlines, tr) {
    let _underlines = underlines.map(tr.changes);
    for (const e of tr.effects)
      if (e.is(addUnderline)) {
        _underlines = _underlines.update({
          // add everytime
          add: [underlineMarkDeco.range(e.value.from, e.value.to)],
        });
      }
    return _underlines;
  },
  provide: (f) => EditorView.decorations.from(f),
});

/** underline from selection ranges */
export function underlineSelectionCmd(view: EditorView) {
  const effects: StateEffect<unknown>[] = view.state.selection.ranges
    .filter((r) => !r.empty)
    .map(({ from, to }) => addUnderline.of({ from, to }));
  if (!effects.length) return false;

  if (!view.state.field(underlineState, false)) {
    effects.push(StateEffect.appendConfig.of([underlineState, underlineTheme]));
  }
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

/**
 * Mark decorations add some attributes or wrapping DOM element to pieces of content.
 * - defines a state field that tracks which parts of the document are underlined, and provides mark decoration that draw those underlines.
 * - 下划线文字会渲染成span并添加css属性text-decoration(line style color thickness), u标签不适合
 * - ✨ support multi lines
 * - 🔲 code is simplified, the field stores only the decoration range set. It doesn't do things like joining overlapping underlines
 */
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
