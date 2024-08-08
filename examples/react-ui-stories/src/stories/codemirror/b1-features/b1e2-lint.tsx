import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';

import { Compartment } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { linter, type Diagnostic, lintGutter } from '@codemirror/lint';

const regexpLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  syntaxTree(view.state)
    .cursor()
    .iterate((node) => {
      if (node.name === 'RegExp')
        diagnostics.push({
          from: node.from,
          to: node.to,
          severity: 'warning',
          message: 'Regular expressions are FORBIDDEN',
          actions: [
            {
              name: 'Remove',
              apply(view, from, to) {
                view.dispatch({ changes: { from, to } });
              },
            },
          ],
        });
    });
  return diagnostics;
});

export const LintCm = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      doc: `function isNumber(string) {
        return /^\\d+(\\.\\d*)?$/.test(string)
      }`,
      extensions: [basicSetup, javascript(), lintGutter(), regexpLinter],
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
