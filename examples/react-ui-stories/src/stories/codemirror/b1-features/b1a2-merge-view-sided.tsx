import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import { MergeView } from '@codemirror/merge';
import { Compartment, EditorState } from '@codemirror/state';

const doc = `one
two
three
four
five`;
const docSix = doc.replace(/t/g, 'T') + '\\nSix';

export const MergeViewSided = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const view = new MergeView({
      a: {
        doc,
        extensions: basicSetup,
      },
      b: {
        doc: docSix,
        extensions: [
          basicSetup,
          EditorView.editable.of(false),
          EditorState.readOnly.of(true),
        ],
      },
      parent: editorRef.current,
    });

    return () => {
      view.destroy();
    };
  }, []);

  return (
    <div id='CMEditor'>
      <div ref={editorRef} />
    </div>
  );
};
