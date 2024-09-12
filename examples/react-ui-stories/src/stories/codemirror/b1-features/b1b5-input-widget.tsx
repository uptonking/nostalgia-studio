import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import {
  WidgetType,
  drawSelection,
  ViewPlugin,
  Decoration,
} from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';

// import { markdown } from '@codemirror/lang-markdown';

class InputWidget extends WidgetType {
  constructor() {
    super();
  }

  eq() {
    return false;
  }

  toDOM() {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'inline-block';
    const input = document.createElement('input');
    input.style.caretColor = 'green';
    wrapper.appendChild(input);
    return wrapper;
  }

  ignoreEvent() {
    return true;
  }
}

const widget = new InputWidget();
const renderInput = () =>
  Decoration.set(Decoration.widget({ widget: widget, side: 1 }).range(0));

const inputWidgetPlugin = ViewPlugin.define(
  () => ({
    decorations: renderInput(),
  }),
  {
    decorations: (v) => v.decorations,
  },
);

/**
 * input as inline widget by Decoration.widget
 * - 浏览器的选区默认是浅蓝色，codemirror的选区默认是浅紫色
 * - [Inability to use ::selector with an <input /> widget when using the `drawSelection` plugin - v6 - discuss.CodeMirror](https://discuss.codemirror.net/t/inability-to-use-selector-with-an-input-widget-when-using-the-drawselection-plugin/8182)
 */
export const InputWidgetInline = () => {
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
        inputWidgetPlugin,
        drawSelection(), // enable this line for built-in ::selection to work
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
