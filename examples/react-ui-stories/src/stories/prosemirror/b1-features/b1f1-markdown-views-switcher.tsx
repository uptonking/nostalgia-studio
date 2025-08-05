import '../styles/editor-examples.css';
// import { applyDevTools } from 'prosemirror-dev-toolkit';

import { exampleSetup } from 'prosemirror-example-setup';
import {
  defaultMarkdownParser,
  defaultMarkdownSerializer,
  schema,
} from 'prosemirror-markdown';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React, { useEffect, useRef, useState } from 'react';

import styled from '@emotion/styled';

// import { StyledContainer } from '../editor-examples.styles';

type MDViewsTypes = 'markdown' | 'prosemirror';

class MarkdownView {
  textarea: HTMLTextAreaElement;

  constructor(target: HTMLElement, content: string) {
    this.textarea = target.appendChild(document.createElement('textarea'));
    this.textarea.value = content;
  }

  get content() {
    return this.textarea.value;
  }
  focus() {
    this.textarea.focus();
  }
  destroy() {
    this.textarea.remove();
  }
}

class ProseMirrorView {
  view: EditorView;

  constructor(target: HTMLElement, content: string) {
    this.view = new EditorView(target, {
      state: EditorState.create({
        doc: defaultMarkdownParser.parse(content),
        plugins: exampleSetup({ schema }),
      }),
    });
  }

  get content() {
    return defaultMarkdownSerializer.serialize(this.view.state.doc);
  }
  focus() {
    this.view.focus();
  }
  destroy() {
    this.view.destroy();
  }
}

/**
 * ✨ 官方编辑器示例，基于 prosemirror-markdown 。
 * - https://prosemirror.net/examples/markdown/
 *
 * - 👉🏻 本示例要点
 */
export const MarkdownViewsSwitcher = () => {
  const editorContainer = useRef<HTMLDivElement>();
  const initialContentContainer = useRef<HTMLTextAreaElement>();
  const viewInstance = useRef<MarkdownView | ProseMirrorView | null>(null);

  const [currentView, setCurrentView] = useState<MDViewsTypes>('markdown');

  useEffect(() => {
    const MDView = currentView === 'markdown' ? MarkdownView : ProseMirrorView;

    viewInstance.current = new MDView(
      editorContainer.current,
      viewInstance.current
        ? viewInstance.current.content
        : initialContentContainer.current.value,
    );

    return () => viewInstance.current?.destroy();
  }, [currentView]);

  return (
    <div>
      <div
        onChange={(e) => {
          // @ts-expect-error
          setCurrentView(e.target.value);
        }}
        style={{ textAlign: 'center' }}
      >
        <label style={{ borderRight: '1px solid silver' }}>
          Markdown
          <input
            type='radio'
            name='inputformat'
            value='markdown'
            defaultChecked
          />
          &nbsp;
        </label>
        <label>
          &nbsp;
          <input type='radio' name='inputformat' value='prosemirror' /> WYSIWYM
        </label>
      </div>

      <div ref={editorContainer} id='editor' />
      {/* 👇🏻 剩下的全是默认隐藏的编辑器初始数据 */}
      <div style={{ display: 'none' }}>
        <textarea ref={initialContentContainer} id='content'>
          This is a comment written in [Markdown](http://commonmark.org). *You*
          may know the syntax for inserting a link, but does your whole
          audience?&#13;&#13;So you can give people the **choice** to use a more
          familiar, discoverable interface.
        </textarea>
      </div>
    </div>
  );
};

// const StyledDemoContainer = styled(StyledContainer)`
//   .ProseMirror {
//     height: 120px;
//     overflow-y: auto;
//     box-sizing: border-box;
//   }
//   textarea {
//     width: 100%;
//     min-width: 420px;
//     height: 123px;
//     border: 1px solid silver;
//     box-sizing: border-box;
//     padding: 3px 10px;
//     border: none;
//     outline: none;
//     font-family: inherit;
//     font-size: inherit;
//   }
//   .ProseMirror-menubar-wrapper,
//   #markdown textarea {
//     display: block;
//     margin-bottom: 4px;
//   }
// `;
