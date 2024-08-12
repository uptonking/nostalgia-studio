import '../styles/decorations.scss';

import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import {
  Compartment,
  EditorState,
  StateField,
  StateEffect,
} from '@codemirror/state';
import { Decoration, type DecorationSet } from '@codemirror/view';

const lineHighlightDeco = Decoration.line({
  attributes: {
    style: 'background-color: #d2ffff',
    class: 'cm-line-typewriter',
  },
});

const addLineHighlight = StateEffect.define<number>();

const lineHighlightState = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(lines, tr) {
    let _lines = lines.map(tr.changes);
    for (const ef of tr.effects) {
      if (ef.is(addLineHighlight)) {
        // stop the current line
        _lines = Decoration.none;
        _lines = _lines.update({ add: [lineHighlightDeco.range(ef.value)] });
      }
    }
    return _lines;
  },
  provide: (f) => EditorView.decorations.from(f),
});

/**
 * typewriter effect on mouseover use css-only animation 
 */
export const DecoLineTypewriter = () => {
  const content = `# CodeMirror v6

This is an codemirror line decoration example at 20240806

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
      extensions: [basicSetup, lineHighlightState],
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
