import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import { unifiedMergeView } from '@codemirror/merge';
import { Compartment } from '@codemirror/state';

const doc = `one
two
three
four
five`;
const docSix = doc.replace(/t/g, 'T') + '\\nSix';

export const MergeViewUnified = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      extensions: [
        basicSetup,
        // language.of(markdown()),
        unifiedMergeView({
          original: doc,
          gutter: true,
        }),
      ],
      doc: docSix,
      parent: editorRef.current,
    });

    return () => {
      editor.destroy();
    };
  }, []);

  return (
    <div id='CMEditor'>
      <div ref={editorRef} />
    </div>
  );
};
