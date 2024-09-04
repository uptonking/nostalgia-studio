import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import { MergeView } from '@codemirror/merge';
import { Compartment, EditorState } from '@codemirror/state';

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

/**
 * ✨ 默认示例是左边旧代码可编辑，右边新代码不可编辑，与vscode相反
 * - https://codemirror.net/try/?example=Merge%20View
 */
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
      orientation: 'a-b',
      gutter: true,
      revertControls: 'a-to-b',
      // renderRevertControl: ,11111
      highlightChanges: true,
      collapseUnchanged: { margin: 2, minSize: 3 },
      // diffConfig:{ scanLimit: 10000 },1111
    });
    window['edd'] = view;

    return () => {
      view.destroy();
      window['edd'] = undefined;
    };
  }, []);

  return (
    <div className='idCMEditor'>
      <div ref={editorRef} />
    </div>
  );
};
