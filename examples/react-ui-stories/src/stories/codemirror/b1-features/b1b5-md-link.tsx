import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import { syntaxTree } from '@codemirror/language';
import {
  EditorState,
  RangeSetBuilder,
  StateField,
  Compartment,
} from '@codemirror/state';
import { Decoration, WidgetType, type DecorationSet } from '@codemirror/view';

class Link extends WidgetType {
  text: any;
  url: any;

  constructor(text, url) {
    super();
    this.text = text;
    this.url = url;
  }
  eq(other) {
    return this.text == other.text && this.url == other.url;
  }
  toDOM() {
    const link = document.createElement('a');
    link.textContent = this.text;
    link.href = this.url;
    return link;
  }
}

const decorationsField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(_, tr) {
    const builder = new RangeSetBuilder();
    const cursor = tr.state.selection.main.head;
    syntaxTree(tr.state).iterate({
      enter: (node) => {
        if ((cursor < node.from || cursor > node.to) && node.name == 'Link') {
          const marks = node.node.getChildren('LinkMark');
          const text =
            marks.length >= 2
              ? tr.state.sliceDoc(marks[0].to, marks[1].from)
              : '';

          const urlNode = node.node.getChild('URL');
          const url = urlNode
            ? tr.state.sliceDoc(urlNode.from, urlNode.to)
            : '';
          builder.add(
            node.from,
            node.to,
            Decoration.replace({
              widget: new Link(text, url),
            }),
          );
          return false;
        }
        return true;
      },
    });
    return builder.finish() as DecorationSet;
  },
  provide: (f) => EditorView.decorations.from(f),
});

/**
 * 只有编辑器获取到focus且光标不在link文本位置时才会显示link蓝色样式，否则显示link纯文本
 */
export const MdLink = () => {
  const content = `# CodeMirror v6

只有编辑器获取到focus且光标不在link文本位置时才会显示link蓝色样式，否则显示link纯文本

有时需要连按2次方向下键或右键才能让光标进入link文本

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
      extensions: [basicSetup, decorationsField, language.of(markdown())],
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
