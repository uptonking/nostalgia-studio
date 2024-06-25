import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import { Compartment } from '@codemirror/state';

export const CMMinimal = () => {
  const content = `# CodeMirror v6

This is an cm example

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
      extensions: [basicSetup, language.of(markdown())],
      doc: content,
      parent: editorRef.current,
    });
  }, [content]);

  return (
    <div id='CMEditor'>
      <div ref={editorRef} />
    </div>
  );
};
