import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { Compartment } from '@codemirror/state';
import {
  autocompletion,
  type CompletionContext,
} from '@codemirror/autocomplete';
import { html } from '@codemirror/lang-html';
import { syntaxTree } from '@codemirror/language';
import { javascriptLanguage } from '@codemirror/lang-javascript';

function myCompletions(context: CompletionContext) {
  const word = context.matchBefore(/\w*/);
  if (word.from == word.to && !context.explicit) return null;
  return {
    from: word.from,
    options: [
      { label: 'match', type: 'keyword' },
      { label: 'hello', type: 'variable', info: '(World)' },
      { label: 'magic', type: 'text', apply: '⠁⭒*.✩.*⭒⠁', detail: 'macro' },
    ],
  };
}

const tagOptions = [
  'constructor',
  'deprecated',
  'link',
  'param',
  'returns',
  'type',
].map((tag) => ({ label: '@' + tag, type: 'keyword' }));

function completeJSDoc(context: CompletionContext) {
  const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);
  if (
    nodeBefore.name !== 'BlockComment' ||
    context.state.sliceDoc(nodeBefore.from, nodeBefore.from + 3) != '/**'
  )
    return null;
  const textBefore = context.state.sliceDoc(nodeBefore.from, context.pos);
  const tagBefore = /@\w*$/.exec(textBefore);
  if (!tagBefore && !context.explicit) return null;
  return {
    from: tagBefore ? nodeBefore.from + tagBefore.index : context.pos,
    options: tagOptions,
    validFor: /^(@\w*)?$/,
  };
}

const jsDocCompletions = javascriptLanguage.data.of({
  autocomplete: completeJSDoc,
});

export const AutocompleteCm = () => {
  const htmlEditorRef = useRef<HTMLDivElement>(null);
  const overrideEditorRef = useRef<HTMLDivElement>(null);
  const jsAstEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      doc: '<!doctype html>\n<html>\n  \n</html>',
      extensions: [basicSetup, html()],
      parent: htmlEditorRef.current,
    });
    window['edd'] = editor;

    const overrideEditor = new EditorView({
      doc: 'Press Ctrl-Space in here...\n',
      extensions: [basicSetup, autocompletion({ override: [myCompletions] })],
      parent: overrideEditorRef.current,
    });

    const jsAstEditor = new EditorView({
      doc: '/** Complete tags here\n    @pa\n */\n',
      extensions: [
        basicSetup,
        javascriptLanguage,
        jsDocCompletions,
        autocompletion(),
      ],
      parent: jsAstEditorRef.current,
    });

    return () => {
      editor.destroy();
      overrideEditor.destroy();
      jsAstEditor.destroy();
      window['edd'] = undefined;
    };
  }, []);

  return (
    <div className='idCMEditor'>
      <h2> html autocomplete</h2>
      <div ref={htmlEditorRef} />
      <h2> override autocomplete</h2>
      <div ref={overrideEditorRef} />
      <h2> js ast autocomplete</h2>
      <div ref={jsAstEditorRef} />
    </div>
  );
};
