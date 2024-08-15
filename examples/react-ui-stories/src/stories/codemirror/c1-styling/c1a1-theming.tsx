import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import { Compartment, EditorState } from '@codemirror/state';

const tLight1 = EditorView.theme(
  {
    '&': {
      color: 'black',
      backgroundColor: '#f1f1f1',
    },
    '.cm-content': {
      caretColor: '#0e9',
    },
    '.cm-gutters': {
      color: '#0e9',
      border: 'none',
    },
  },
  { dark: false },
);
const tDark1 = EditorView.theme(
  {
    '&': {
      color: 'white',
      backgroundColor: '#333',
    },
    '.cm-content': {
      caretColor: '#850505',
    },
    '.cm-gutters': {
      color: '#850505',
      border: 'none',
    },
  },
  { dark: true },
);

function createEditorState(initialContents, myTheme) {
  const extensions = [themeConfig.of(themeMapping(tLight1))];
  return EditorState.create({
    doc: initialContents,
    extensions,
  });
}

function createEditorView(state, parent) {
  return new EditorView({ state, parent });
}

const themeConfig = new Compartment();

function themeMapping(myTheme) {
  switch (myTheme) {
    case 'light':
      return tLight1;
    case 'dark':
      return tDark1;
    default:
      return tLight1;
  }
}

function changeEditorTheme(myEditor, myTheme) {
  myEditor.dispatch({
    effects: themeConfig.reconfigure(themeMapping(myTheme)),
  });
}

export const Theming = () => {
  const content = `# CodeMirror v6

This is an cm example at 20240806

## Lists

- apple
- banana
- another fruit

## Links

[Some Link](https://example.org)
`;

  const editorRef = useRef<HTMLDivElement>(null);
  const editView = useRef<EditorView>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      // extensions: [basicSetup, language.of(markdown())],
      extensions: [themeConfig.of(themeMapping(tLight1))],
      doc: content,
      parent: editorRef.current,
    });
    editView.current = editor;
    window['edd'] = editor;

    return () => {
      editor.destroy();
      window['edd'] = undefined;
    };
  }, [content]);

  return (
    <div className='idCMEditor'>
      <div>
        <button onClick={() => changeEditorTheme(editView.current, 'light')}>
          Light
        </button>
        <button onClick={() => changeEditorTheme(editView.current, 'dark')}>
          Dark
        </button>
      </div>
      <div ref={editorRef} />
    </div>
  );
};
