import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import { animatableDiffView } from '@codemirror/merge';
import { Compartment } from '@codemirror/state';

const doc1 = `one
two
three
four
five`;
const docSix1 = doc1.replace(/t/g, 'T') + '\nSix';

const doc = `one cat
two books to read
three meals
four cups of tea
what a wonderful world to live 
five
line8
line9
line10
line11
line12
line13
line14
line15
examples are strings with insert/delete/update op
new line after will highlight current line`;
// new string with insert/delete/update op
const docSix =
  doc
    .replace('line9\n', '')
    .replace('ful', '')
    .replace('live', '')
    .replace('tea', 'coffee')
    .replace(/b/g, 'B') + '\nSix';

export const MergeViewAnimatable = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      extensions: [
        basicSetup,
        // language.of(markdown()),
        animatableDiffView({
          original: doc,
          gutter: true,
          highlightChanges: false,
          syntaxHighlightDeletions: true,
          mergeControls: false,
          // diffConfig:{ scanLimit: 10000 },
        }),
      ],
      doc: docSix,
      parent: editorRef.current,
    });
    window['edd'] = editor;

    return () => {
      editor.destroy();
      window['edd'] = undefined;
    };
  }, []);

  return (
    <div className='idCMEditor'>
      <div ref={editorRef} />
    </div>
  );
};
