import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import { Compartment, EditorState } from '@codemirror/state';
import { readOnly } from '../../../../../../editor-codemirror/src-pkgs/state/src/extension';

/**
 * ✨ `EditorView.editable.of(false)` 会将`.cm-content`的`contenteditable`设为false
 */
export const EditableFalse = () => {
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
        // editable- false , readOnly- false，此时contenteditable`为false
        // EditorView.editable.of(false),
        EditorState.readOnly.of(true),
        // editable- true , readOnly- true, 此时能显示光标，但输入字符不会插入编辑器
        // 此时contenteditable`为true
        EditorView.updateListener.of((viewUpdate) => {
          console.log(
            ';; editable-',
            viewUpdate.state.facet(EditorView.editable),
            ', readOnly-',
            viewUpdate.state.readOnly,
          );
        }),
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
