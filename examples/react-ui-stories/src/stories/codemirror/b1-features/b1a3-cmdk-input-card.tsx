import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { Compartment } from '@codemirror/state';
import { inputCardEmbedded } from '@datalking/cm-input-card-embedded';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const cmdkInputCard = inputCardEmbedded({
  chat: async () => {
    await sleep(2000);
    return {
      status: 'success',
      message: ' ;;;AI CODED;\n// replace mock data with your own api;;; ',
    };
  },
  cancelChat: () => {},
});

export const CmdkInputCard = () => {
  const content = `# CodeMirror v6

Cmd+K is the shortcut for ai-assisted single file editing

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
        cmdkInputCard,
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