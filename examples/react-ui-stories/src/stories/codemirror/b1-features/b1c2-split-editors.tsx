import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';

import {
  EditorState,
  Compartment,
  Transaction,
  Annotation,
} from '@codemirror/state';
import {
  defaultKeymap,
  historyKeymap,
  history,
  undo,
  redo,
} from '@codemirror/commands';
import { drawSelection, keymap, lineNumbers } from '@codemirror/view';

let mainView: EditorView;
let otherView: EditorView;

const startState = EditorState.create({
  doc: 'The document\nis\nshared',
  extensions: [
    history(),
    drawSelection(),
    lineNumbers(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
  ],
});

const otherState = EditorState.create({
  doc: startState.doc,
  extensions: [
    drawSelection(),
    lineNumbers(),
    keymap.of([
      ...defaultKeymap,
      { key: 'Mod-z', run: () => undo(mainView) },
      { key: 'Mod-y', mac: 'Mod-Shift-z', run: () => redo(mainView) },
    ]),
  ],
});

const syncAnnotation = Annotation.define<boolean>();

function syncDispatch(tr: Transaction, view: EditorView, other: EditorView) {
  view.update([tr]);
  if (!tr.changes.empty && !tr.annotation(syncAnnotation)) {
    const annotations: Annotation<any>[] = [syncAnnotation.of(true)];
    const userEvent = tr.annotation(Transaction.userEvent);
    if (userEvent) annotations.push(Transaction.userEvent.of(userEvent));
    other.dispatch({ changes: tr.changes, annotations });
  }
}

export const SplitEditors = () => {
  const content = `# CodeMirror v6

This is an cm example at 20240806

## Lists

- apple
- banana
- another fruit

## Links

[Some Link](https://example.org)
`;

  const mainEditorRef = useRef<HTMLDivElement>(null);
  const otherEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    // const editor = new EditorView({
    //   extensions: [basicSetup, language.of(markdown())],
    //   doc: content,
    //   parent: editorRef.current,
    // });
    mainView = new EditorView({
      state: startState,
      parent: mainEditorRef.current,
      dispatch: (tr) => syncDispatch(tr, mainView, otherView),
    });

    otherView = new EditorView({
      state: otherState,
      parent: otherEditorRef.current,
      dispatch: (tr) => syncDispatch(tr, otherView, mainView),
    });

    window['edd'] = mainView;

    return () => {
      mainView.destroy();
      otherView.destroy();
      window['edd'] = undefined;
    };
  }, [content]);

  return (
    <div className='idCMEditor'>
      <h2> main editor</h2>
      <div ref={mainEditorRef} />
      <h2> other editor</h2>
      <div ref={otherEditorRef} />{' '}
    </div>
  );
};
