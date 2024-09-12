import React, { useEffect, useRef, useState } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { animatableDiffView } from '@codemirror/merge';
import {
  Compartment,
  type StateEffect,
  type ChangeSpec,
} from '@codemirror/state';

const doc1 = `one
two
three
four
five`;
const docSix1 = doc1.replace(/t/g, 'T') + '\nSix';

const doc = `one cat
two books to read
three meals
four cups of tea
what a wonderful world to live 
five
line8
line9
line10
line11
line12
line13
line14
line15
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
    .replace(/b/g, 'B') + '\nSix';

type DiffViewConfig = {
  enableDiff: boolean;
  showTypewriterAnimation: boolean;
  showGutter: boolean;
  enableHighlightChanges: boolean;
  showMergeControls: boolean;
};

const initialDiffViewConfig = {
  enableDiff: true,
  showTypewriterAnimation: true,
  showGutter: true,
  enableHighlightChanges: false,
  showMergeControls: false,
};

const animatableDiffViewCompartment = new Compartment();

const maxHeightEditor = EditorView.theme({
  '&': {
    width: '70vw',
    maxHeight: '40vh',
  },
  '.cm-scroller': { overflow: 'auto' },
});

export const MergeViewAnimatable = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  const [diffViewConfig, setDiffViewConfig] = useState<DiffViewConfig>(
    initialDiffViewConfig,
  );

  useEffect(() => {
    const editor = new EditorView({
      extensions: [
        basicSetup,
        maxHeightEditor,
        animatableDiffViewCompartment.of(
          initialDiffViewConfig.enableDiff && docSix !== doc
            ? animatableDiffView({
                original: doc,
                gutter: initialDiffViewConfig.showGutter,
                showTypewriterAnimation:
                  initialDiffViewConfig.showTypewriterAnimation,
                highlightChanges: initialDiffViewConfig.enableHighlightChanges,
                syntaxHighlightDeletions: true,
                mergeControls: initialDiffViewConfig.showMergeControls,
                // diffConfig:{ scanLimit: 10000 },
              })
            : [],
        ),
      ],
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
    const effects: StateEffect<any>[] = [];
    // const changes: ChangeSpec[] = [];
    effects.push(
      animatableDiffViewCompartment.reconfigure(
        diffViewConfig?.enableDiff
          ? animatableDiffView({
              original: doc,
              gutter: diffViewConfig.showGutter,
              showTypewriterAnimation: diffViewConfig.showTypewriterAnimation,
              highlightChanges: diffViewConfig.enableHighlightChanges,
              syntaxHighlightDeletions: true,
              mergeControls: diffViewConfig.showMergeControls,
            })
          : [],
      ),
    );
    window['edd'].dispatch({
      effects: effects,
      // changes: changes,
    });
  }, [diffViewConfig]);

  // console.log(';; render-config ', diffViewConfig);

  return (
    <div className='idCMEditor' style={{}}>
      <div className='configToolbar' style={{ display: 'flex', gap: '10px' }}>
        <div>
          <input
            id='EnableDiff'
            type='checkbox'
            checked={Boolean(diffViewConfig.enableDiff)}
            onChange={(evt) =>
              setDiffViewConfig({
                ...diffViewConfig,
                enableDiff: evt.target.checked,
              })
            }
          />
          <label htmlFor='EnableDiff'>Enable Diff</label>
        </div>
        <div>
          <input
            id='MergeViewGutter'
            type='checkbox'
            checked={Boolean(diffViewConfig.showGutter)}
            onChange={(evt) =>
              setDiffViewConfig({
                ...diffViewConfig,
                showGutter: evt.target.checked,
              })
            }
          />
          <label htmlFor='MergeViewGutter'>Gutter</label>
        </div>
        {diffViewConfig.showTypewriterAnimation ? null : (
          <div>
            <input
              id='MergeViewHighlightChanges'
              type='checkbox'
              checked={Boolean(diffViewConfig.enableHighlightChanges)}
              onChange={(evt) =>
                setDiffViewConfig({
                  ...diffViewConfig,
                  enableHighlightChanges: evt.target.checked,
                })
              }
            />
            <label htmlFor='MergeViewHighlightChanges'>Highlight Changes</label>
          </div>
        )}
        <div>
          <input
            id='typewriterAnimation'
            type='checkbox'
            checked={Boolean(diffViewConfig.showTypewriterAnimation)}
            onChange={(evt) =>
              setDiffViewConfig({
                ...diffViewConfig,
                showTypewriterAnimation: evt.target.checked,
              })
            }
          />
          <label htmlFor='typewriterAnimation'>Typewriter</label>
        </div>
      </div>
      <div ref={editorRef} />
    </div>
  );
};
