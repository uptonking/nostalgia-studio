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

type OnChange = (value: string, viewUpdate: ViewUpdate) => void;

export function onUpdate(onChange: OnChange) {
  return EditorView.updateListener.of((viewUpdate: ViewUpdate) => {
    if (viewUpdate.docChanged) {
      const doc = viewUpdate.state.doc;
      const value = doc.toString();
      onChange(value, viewUpdate);
    }
  });
}

/**
 * [Revisiting our CodeMirror 6 implementation in React after the official release _202210](https://codiga.io/blog/revisiting-codemirror-6-react-implementation/)
 */
export function useCodeMirror(extensions) {
  const ref = useRef();
  const [view, setView] = useState<EditorView>();

  useEffect(() => {
    const view = new EditorView({
      extensions: [
        basicSetup,
        /**
         * Check each language package to see what they support,
         * for instance javascript can use typescript and jsx.
         */
        javascript({
          jsx: true,
          typescript: true,
        }),
        ...extensions,
      ],
      // @ts-expect-error fix-types
      parent: ref,
    });

    setView(view);

    /**
     * Make sure to destroy the codemirror instance
     * when our components are unmounted.
     */
    return () => {
      view.destroy();
      setView(undefined);
    };
  }, []);

  return { ref, view };
}

export function useCodeEditor({ value, onChange, extensions }) {
  const { ref, view } = useCodeMirror([onUpdate(onChange), ...extensions]);

  useEffect(() => {
    if (view) {
      const editorValue = view.state.doc.toString();

      if (value !== editorValue) {
        view.dispatch({
          changes: {
            from: 0,
            to: editorValue.length,
            insert: value || '',
          },
        });
      }
    }
  }, [value, view]);

  return ref;
}

export function CodeEditor({ value, onChange, extensions }) {
  const ref = useCodeEditor({ value, onChange, extensions });

  return <div ref={ref} />;
}

export const CMMinimal2 = () => {
  const [code, setCode] = useState('console.log');

  return (
    <CodeEditor
      value={code}
      onChange={(newCode) => {
        setCode(newCode);
      }}
      extensions={[]}
    />
  );
};
