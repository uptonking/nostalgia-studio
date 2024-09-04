import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';
import { autocompletion } from '@codemirror/autocomplete';

import { Compartment } from '@codemirror/state';

// Our list of completions (can be static, since the editor
/// will do filtering based on context).
const completions = [
  { label: 'panic', type: 'keyword' },
  { label: 'park', type: 'constant', info: 'Test completion' },
  { label: 'password', type: 'variable' },
];

function myCompletions(context) {
  const before = context.matchBefore(/\w+/);
  // If completion wasn't explicitly started and there
  // is no word before the cursor, don't open completions.
  if (!context.explicit && !before) return null;
  return {
    from: before ? before.from : context.pos,
    options: completions,
    validFor: /^\w*$/,
  };
}

export const CustomCompletion = () => {
  const content = "// Type a 'p'\n";

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = new EditorView({
      extensions: [
        basicSetup,
        autocompletion({ override: [myCompletions] }),
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
