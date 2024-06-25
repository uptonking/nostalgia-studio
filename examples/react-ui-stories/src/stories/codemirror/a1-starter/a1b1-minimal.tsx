import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { javascript } from '@codemirror/lang-javascript';
import { markdown } from '@codemirror/lang-markdown';
import { Compartment, EditorState } from '@codemirror/state';
import type { ViewUpdate } from '@codemirror/view';
import { CodeMirrorReact } from '@datalking/codemirror-react';

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

export const CMMinimal2 = () => {
  const extensions = useMemo(() => [basicSetup, javascript()], []);

  return <CodeMirrorReact extensions={extensions} />;
};

export const CMMinimal3 = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state = EditorState.create({
      doc: '',
      extensions: [
        basicSetup,
        EditorView.updateListener.of((v) => {
          if (v.docChanged) {
            // handleChange(view); // custom function that will be triggered on every editor change.
          }
        }),
        javascript(),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current!,
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
