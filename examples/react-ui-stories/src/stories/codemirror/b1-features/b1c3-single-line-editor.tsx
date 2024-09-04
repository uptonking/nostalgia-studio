import React, { useEffect, useRef } from 'react';

import { minimalSetup, EditorView } from 'codemirror';

import { Compartment, EditorState } from '@codemirror/state';

export const SingleLineEditor = () => {
  const content = `You cannot add new lines in this editor`;

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      extensions: [
        minimalSetup,
        // Transaction filters can inspect transactions and
        // add/replace them with other transactions. If a
        // transaction would have made the document more than
        // one line long, it is filtered out.
        EditorState.transactionFilter.of((tr) => {
          return tr.newDoc.lines > 1 ? [] : [tr];
        }),
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
