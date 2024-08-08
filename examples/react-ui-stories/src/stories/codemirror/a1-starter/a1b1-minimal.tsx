import React, { useEffect, useRef } from 'react';

import { basicSetup, minimalSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import { Compartment } from '@codemirror/state';

export const CMMinimal = () => {
  const content = `# CodeMirror v6

This is an codemirror example with basicSetup at 20240806

## Lists

- apple
- banana
- another fruit

## Links

[Some Link](https://example.org)
`;

  const miniEditorRef = useRef<HTMLDivElement>(null);
  const basicEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const miniEditor = new EditorView({
      extensions: [minimalSetup, language.of(markdown())],
      doc: content,
      parent: miniEditorRef.current,
    });
    window['edd1'] = miniEditor;

    const editor = new EditorView({
      extensions: [basicSetup, language.of(markdown())],
      doc: content,
      parent: basicEditorRef.current,
    });
    window['edd'] = editor;

    return () => {
      editor.destroy();
      window['edd1'] = undefined;
      window['edd'] = undefined;
    };
  }, [content]);

  return (
    <div className='idCMEditor'>
      <h2> minimal editor</h2>
      <div ref={miniEditorRef} />
      <h2> basic editor</h2>
      <div ref={basicEditorRef} />
    </div>
  );
};
