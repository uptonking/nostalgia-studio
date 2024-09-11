import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import { Compartment, StateField } from '@codemirror/state';
import { WidgetType, Decoration } from '@codemirror/view';

/**
 * use updateDOM to update widget
 */
class FirstLetter extends WidgetType {
  letter: string;

  constructor(letter) {
    super();
    this.letter = letter;
  }

  toDOM() {
    const dom = document.createElement('div');
    dom.style.cssText = 'font-size: 300%; color: coral';
    dom.textContent = this.letter;
    return dom;
  }

  updateDOM(dom, view) {
    console.log('updating');
    dom.textContent = this.letter;
    return true;
  }

  static forDoc(doc) {
    const line = doc.line(1);
    if (!line.length) return Decoration.none;
    return Decoration.set(
      Decoration.widget({
        widget: new FirstLetter(line.text[0]),
        block: true,
      }).range(0),
    );
  }
}

const firstLetterState = StateField.define({
  create(state) {
    return FirstLetter.forDoc(state.doc);
  },
  update(value, tr) {
    return tr.docChanged ? FirstLetter.forDoc(tr.state.doc) : value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export const DerivedLetter = () => {
  const content = `CodeMirror v6

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
      extensions: [
        basicSetup,
        firstLetterState,
        // language.of(markdown())
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
