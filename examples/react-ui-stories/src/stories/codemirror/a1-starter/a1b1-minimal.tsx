import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { javascript } from '@codemirror/lang-javascript';
import { EditorState } from '@codemirror/state';
import type { ViewUpdate } from '@codemirror/view';
import { CodeMirrorReact } from '@datalking/codemirror-react';

export const CMMinimal2 = () => {
  const extensions = useMemo(() => [basicSetup, javascript()], []);

  return <CodeMirrorReact extensions={extensions} />;
};

export const CMMinimal = () => {
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
