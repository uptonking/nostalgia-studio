import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import {
  Compartment,
  EditorState,
  StateField,
  StateEffect,
} from '@codemirror/state';
import { Decoration, type DecorationSet } from '@codemirror/view';

const addLineHighlight = StateEffect.define<number>();

const lineHighlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(lines, tr) {
    lines = lines.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(addLineHighlight)) {
        // remove old deco
        lines = Decoration.none;
        lines = lines.update({ add: [lineHighlightMark.range(e.value)] });
      }
    }
    return lines;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const lineHighlightMark = Decoration.line({
  attributes: { style: 'background-color: #d2ffff' },
});

export const DecoLineHighlight = () => {
  const content = `# CodeMirror v6

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
      extensions: [basicSetup, language.of(markdown()), lineHighlightField],
      doc: content,
      parent: editorRef.current,
    });
    window['edd'] = editor;

    editor.dom.addEventListener('mousemove', (event) => {
      const lastMove = {
        x: event.clientX,
        y: event.clientY,
        target: event.target,
        time: Date.now(),
      };
      const pos = editor.posAtCoords(lastMove);
      const lineNo = editor.state.doc.lineAt(pos).number;
      const docPosition = editor.state.doc.line(lineNo).from;
      editor.dispatch({ effects: addLineHighlight.of(docPosition) });
    });

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
