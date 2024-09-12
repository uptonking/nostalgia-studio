import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { javascript } from '@codemirror/lang-javascript';
import { EditorState, StateField, Compartment } from '@codemirror/state';
import { Decoration, WidgetType } from '@codemirror/view';

/**
 * block widget
 */
class HelloWidget extends WidgetType {
  toDOM() {
    const el = document.createElement('div');
    el.innerHTML = "Hello world! (it's a widget)";
    return el;
  }
}

const buildDecos = (state) => {
  const decos = [];
  const line = state.doc.line(1);

  if (state.selection.ranges[0].from < line.to) return Decoration.none;

  return Decoration.set([
    Decoration.replace({
      widget: new HelloWidget(),
      inclusive: true,
      block: true,
    }).range(line.from, line.to),
  ]);
};

export const decosExtension = StateField.define({
  create(state) {
    return buildDecos(state);
  },
  update(deco, tr) {
    if (tr.selection || tr.docChanged) deco = buildDecos(tr.state);
    return deco.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

/**
 * block widget by Decoration.replace
 */
export const MdToggleOnCursor = () => {
  const content = `console.log('hello')

let startState = EditorState.create({
doc: "Hello World",
extensions: [keymap.of(defaultKeymap)]
})

let view = new EditorView({
  state: startState,
  parent: document.body
})
`;

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      extensions: [
        basicSetup,
        // language.of(markdown())
        javascript(),
        decosExtension,
      ],
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
