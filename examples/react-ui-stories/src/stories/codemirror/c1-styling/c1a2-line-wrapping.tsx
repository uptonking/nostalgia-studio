import React, { useEffect, useRef, useState } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { Compartment, type StateEffect } from '@codemirror/state';
import { makeTextByWords } from '../utils/lorem-ipsum';

// const doc = makeTextByWords(1000);
// const doc3 = makeTextByWords(2000);

const doc = `one cat
two books to read
three meals
four cups of tea
what a wonderful world to live 
five
line7
使用选项式 API，我们可以用包含多个选项的对象来描述组件的逻辑，例如 data、methods 和 mounted。选项所定义的属性都会暴露在函数内部的 this 上，它会指向当前的组件实例。
With Options API, we define a component's logic using an object of options such as data, methods, and mounted. Properties defined by options are exposed on this inside functions, which points to the component instance.
通过组合式 API，我们可以使用导入的 API 函数来描述组件逻辑。在单文件组件中，组合式 API 通常会与 <script setup> 搭配使用。这个 setup attribute 是一个标识，告诉 Vue 需要在编译时进行一些处理，让我们可以更简洁地使用组合式 API。比如，<script setup> 中的导入和顶层变量/函数都能够在模板中直接使用。
With Composition API, we define a component's logic using imported API functions. In SFCs, Composition API is typically used with <script setup>. The setup attribute is a hint that makes Vue perform compile-time transforms that allow us to use Composition API with less boilerplate. For example, imports and top-level variables / functions declared in <script setup> are directly usable in the template.
examples are strings with insert/delete/update op
line8
line9
line10
line11
line12
line13
line14
line15
new line after will highlight current line`;
// new string with insert/delete/update op
const docSix =
  doc
    .replace('line9\n', '')
    .replace('ful', '')
    .replace('live', '')
    .replace('tea', 'coffee')
    // .replace('and', 'then')
    .replace(/b/g, 'B') + '\nSix';

type ViewConfig = {
  enableLineWrapping: boolean;
};

const initialViewConfig: ViewConfig = {
  enableLineWrapping: true,
};

const lineWrappingCompartment = new Compartment();

const maxHeightEditor = EditorView.theme({
  '&': {
    width: '70vw',
    maxHeight: '40vh',
  },
  '.cm-scroller': { overflow: 'auto' },
});

export const LineWrapping = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  const [viewConfig, setViewConfig] = useState<ViewConfig>(
    initialViewConfig,
  );

  useEffect(() => {
    const editor = new EditorView({
      extensions: [basicSetup, maxHeightEditor, lineWrappingCompartment.of([])],
      doc: docSix,
      parent: editorRef.current,
    });
    window['edd'] = editor;

    return () => {
      editor.destroy();
      window['edd'] = undefined;
    };
  }, []);

  useEffect(() => {
    const effects: StateEffect<unknown>[] = [];
    effects.push(
      lineWrappingCompartment.reconfigure(
        viewConfig?.enableLineWrapping ? EditorView.lineWrapping : [],
      ),
    );
    window['edd'].dispatch({
      effects: effects,
    });
  }, [viewConfig?.enableLineWrapping]);

  // console.log(';; render-config ', diffViewConfig);

  return (
    <div className='idCMEditor' style={{}}>
      <div className='configToolbar' style={{ display: 'flex', gap: '10px' }}>
        <div>
          <input
            id='EnableLineWrapping'
            type='checkbox'
            checked={Boolean(viewConfig.enableLineWrapping)}
            onChange={(evt) =>
              setViewConfig({
                ...viewConfig,
                enableLineWrapping: evt.target.checked,
              })
            }
          />
          <label htmlFor='EnableLineWrapping'>Enable LineWrapping</label>
        </div>
        {/* <div>
          <input
            id='typewriterAnimation'
            type='checkbox'
            checked={Boolean(viewConfig.showTypewriterAnimation)}
            onChange={(evt) =>
              setViewConfig({
                ...viewConfig,
                showTypewriterAnimation: evt.target.checked,
              })
            }
          />
          <label htmlFor='typewriterAnimation'>Typewriter</label>
        </div> */}
      </div>
      <div ref={editorRef} />
    </div>
  );
};
