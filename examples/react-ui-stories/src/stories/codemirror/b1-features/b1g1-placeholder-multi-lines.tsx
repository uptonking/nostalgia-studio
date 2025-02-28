import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';
import { placeholder } from '@codemirror/view';

import { Compartment } from '@codemirror/state';

/**
 * ✨ 占位符文本中的\n会在编辑中渲染为换行
 * - 模版字符串中的换行会直接渲染为换行
 */
// const placeholderPlugin = placeholder('start coding...\nhello');
// const placeholderPlugin = placeholder('# Best Practices\n    - Define Rule Objectives\n    - Define coding Standards & Style');
const placeholderPlugin = placeholder(`# Best Practices
  
    - Define Rule Objectives
    - Define coding Standards & Style
    - Avoid Rule Conflicts
  - Provide Examples
  - Key Conventions
  - Organize and Tag
  `);

export const PlaceholderMultiLines = () => {
  const content = ``;
  // 存在初始内容时，placeholder不会显示
  const content1 = `# CodeMirror v6

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
        placeholderPlugin,
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
