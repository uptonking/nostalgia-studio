import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { StateEffect, StateField, Compartment } from '@codemirror/state';

const incrementEffect = StateEffect.define();

const numberField = StateField.define({
  create() {
    return 1;
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(incrementEffect)) {
        value++;
      }
    }
    return value;
  },
});

// 👇 computes a value for the facet
const editorStyle = EditorView.contentAttributes.compute(
  [numberField],
  (state) => {
    return {
      style: `background-color: ${state.field(numberField) % 2 ? '#f1f1f1' : '#88c0d0'}`,
    };
  },
);

export const EffectInterval = () => {
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
      extensions: [
        basicSetup,
        // language.of(markdown()),
        numberField,
        editorStyle,
      ],
      doc: content,
      parent: editorRef.current,
    });
    window['edd'] = editor;

    const interval = window.setInterval(() => {
      editor.dispatch({
        effects: incrementEffect.of(null),
      });
    }, 2000);

    return () => {
      editor.destroy();
      window.clearInterval(interval);
      window['edd'] = undefined;
    };
  }, [content]);

  return (
    <div className='idCMEditor'>
      <div ref={editorRef} />
    </div>
  );
};
