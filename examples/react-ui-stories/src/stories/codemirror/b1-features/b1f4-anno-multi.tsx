import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';

import { EditorState, Annotation, Compartment } from '@codemirror/state';

const annotation1 = Annotation.define();
const annotation2 = Annotation.define();

const listener = EditorView.updateListener.of((update) => {
  const hasAnnotation1 = update.transactions.some((tr) =>
    tr.annotation(annotation1),
  );
  const hasAnnotation2 = update.transactions.some((tr) =>
    tr.annotation(annotation2),
  );
  console.log(
    `Transaction has annotation 1 is ${hasAnnotation1}, has annotation 2 is ${hasAnnotation2}`,
  );
});

const annotator1 = EditorState.transactionExtender.of((tr) => {
  console.log('annotator1');
  return {
    annotations: annotation1.of(true),
  };
});

const annotator2 = EditorState.transactionExtender.of((tr) => {
  console.log('annotator2');
  return {
    annotations: annotation2.of(true),
  };
});

// const view = new EditorView({
//   doc: '',
//   extensions: [annotator1, annotator2, listener],
//   parent: document.body,
// });
// view.dispatch({});

/**
 * - 打印顺序是 anno2、anno1、2个true
 * - 🤔 为什么鼠标在编辑器内连续点击时(改变光标位置)，第一次会打印两遍后续只打印一次
 *   - 第一打印两遍可能是失焦后再次获得焦点导致的
 * 
 */
export const AnnoMulti = () => {
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

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      extensions: [
        basicSetup,
        // language.of(markdown())
        annotator1,
        annotator2,
        listener,
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
