import React, { useEffect, useRef, useState } from 'react';
import { basicSetup, EditorView } from 'codemirror';

import { javascript } from '@codemirror/lang-javascript';
import { Compartment, type StateEffect } from '@codemirror/state';
import { jsLines3k } from '../resources/mock-data';

const maxHeightEditor = EditorView.theme({
  '&': {
    width: '60vw',
    maxHeight: '50vh',
  },
  '.cm-scroller': { overflow: 'auto' },
});

const customEventHandlers = () =>
  EditorView.domEventHandlers({
    keydown(evt, view) {
      console.log(';;kdwn ', evt.key, evt.metaKey, evt.ctrlKey);
    },
  });

type EditorConfig = {
  scrollToFixed?: 'top' | 'bottom' | 'middle';
  scrollTo?: number;
};

// const scrollToCompartment = new Compartment();

/**
 * EditorView.scrollIntoView(pos)创建的effect支持滚动到 start/end/center
 * - EditorView.scrollIntoView(pos)
 *   - 这里的pos超过docLen会定位到文档末尾，不会报错
 * - editorView.dispatch({selection:{anchor: pos}})
 *   - 这里的pos超过docLen会报错, 范围是[0,docLen], 包含两端;
 *   - 这里的pos是小数如66.5时不会报错，只是不生效
 */
export const ScrollToFixedPos = () => {
  const content = `# CodeMirror v6

This is an cm example at 20240806

## Lists

- apple
- banana
- another fruit

## Links

[Some Link](https://example.org)
`;

  const [editorConfig, setEditorConfig] = useState<EditorConfig>({});
  const [editorView, setEditorView] = useState<EditorView>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      extensions: [
        maxHeightEditor,
        basicSetup,
        language.of(javascript()),
        customEventHandlers(),
        // scrollToCompartment.of([]),
      ],
      // doc: content,
      doc: jsLines3k,
      parent: editorRef.current,
    });
    setEditorView(editor);
    window['edd'] = editor;

    return () => {
      editor.destroy();
      window['edd'] = undefined;
    };
  }, [content]);

  useEffect(() => {
    if (!editorView) return;
    const effects: StateEffect<unknown>[] = [];
    let targetAnchor = 0;
    const docLen = editorView.state.doc.length;
    if (editorConfig.scrollToFixed) {
      switch (editorConfig.scrollToFixed) {
        case 'middle':
          // targetAnchor = docLen / 2 + 80;
          targetAnchor = Math.round(docLen / 2);
          break;
        case 'bottom':
          targetAnchor = docLen + 1000;
          // targetAnchor = docLen -100;
          // targetAnchor = docLen ;
          break;

        default:
          targetAnchor = 0;
      }

      effects.push(
        EditorView.scrollIntoView(targetAnchor, {
          y: 'center',
          // y: 'nearest',
          // y: 'end',
        }),
      );
    }
    console.log(';; docLen/targetSel ', docLen, targetAnchor);
    editorView.focus();
    editorView.dispatch({
      effects: effects,
      selection: {
        anchor: targetAnchor > docLen - 1 ? docLen : targetAnchor,
      },
    });
    // editorView.scrollIntoView // 不存在这个api
  }, [editorConfig, editorView]);

  return (
    <div className='idCMEditor'>
      <div className='configToolbar' style={{ display: 'flex', gap: '10px' }}>
        <button onClick={() => setEditorConfig({ scrollToFixed: 'top' })}>
          Scroll to top
        </button>
        <button onClick={() => setEditorConfig({ scrollToFixed: 'bottom' })}>
          Scroll to bottom
        </button>
        <button onClick={() => setEditorConfig({ scrollToFixed: 'middle' })}>
          Scroll to middle
        </button>
      </div>
      <div ref={editorRef} />
    </div>
  );
};
