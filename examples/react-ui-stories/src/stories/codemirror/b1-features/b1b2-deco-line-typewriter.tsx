import '../styles/decorations.scss';

import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import {
  Compartment,
  EditorState,
  StateField,
  StateEffect,
} from '@codemirror/state';
import { Decoration, type DecorationSet } from '@codemirror/view';

const lineHighlightDeco = Decoration.line({
  attributes: {
    style: 'background-color: #d2ffff',
    class: 'cm-line-typewriter',
  },
});

const addLineHighlight = StateEffect.define<number>();

const lineHighlightState = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(lines, tr) {
    let _lines = lines.map(tr.changes);
    for (const ef of tr.effects) {
      if (ef.is(addLineHighlight)) {
        // stop the current line
        _lines = Decoration.none;
        _lines = _lines.update({ add: [lineHighlightDeco.range(ef.value)] });
      }
    }
    return _lines;
  },
  provide: (f) => EditorView.decorations.from(f),
});

/**
 * typewriter effect on mouseover use css-only animation
 */
export const DecoLineTypewriter = () => {
  const content = `# CodeMirror v6

This is an codemirror line decoration example at 20240806

## Lists

- apple
- banana
- another fruit

使用选项式 API，我们可以用包含多个选项的对象来描述组件的逻辑，例如 data、methods 和 mounted。选项所定义的属性都会暴露在函数内部的 this 上，它会指向当前的组件实例。
With Options API, we define a component's logic using an object of options such as data, methods, and mounted. Properties defined by options are exposed on this inside functions, which points to the component instance.
通过组合式 API，我们可以使用导入的 API 函数来描述组件逻辑。在单文件组件中，组合式 API 通常会与 <script setup> 搭配使用。这个 setup attribute 是一个标识，告诉 Vue 需要在编译时进行一些处理，让我们可以更简洁地使用组合式 API。比如，<script setup> 中的导入和顶层变量/函数都能够在模板中直接使用。
With Composition API, we define a component's logic using imported API functions. In SFCs, Composition API is typically used with <script setup>. The setup attribute is a hint that makes Vue perform compile-time transforms that allow us to use Composition API with less boilerplate. For example, imports and top-level variables / functions declared in <script setup> are directly usable in the template.

## Links

[Some Link](https://example.org)
`;

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      extensions: [basicSetup, lineHighlightState],
      doc: content,
      parent: editorRef.current,
    });
    window['edd'] = editor;

    editor.dom.addEventListener('mousemove', (event) => {
      const lastMove = {
        x: event.clientX,
        y: event.clientY,
        target: event.target,
        time: Date.now(),
      };
      const pos = editor.posAtCoords(lastMove);
      const lineNo = editor.state.doc.lineAt(pos).number;
      const docPosition = editor.state.doc.line(lineNo).from;
      editor.dispatch({ effects: addLineHighlight.of(docPosition) });
    });

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
