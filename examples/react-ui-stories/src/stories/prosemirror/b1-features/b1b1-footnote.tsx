import '../styles/editor-examples.css';
// import { applyDevTools } from 'prosemirror-dev-toolkit';

import React, { useEffect, useRef, useState } from 'react';

import { buildMenuItems, exampleSetup } from 'prosemirror-example-setup';
import { history, redo, undo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { MenuItem } from 'prosemirror-menu';
import {
  DOMParser,
  Fragment,
  type Node,
  type NodeSpec,
  NodeType,
  Schema,
} from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { EditorState, type Transaction } from 'prosemirror-state';
import { insertPoint, StepMap } from 'prosemirror-transform';
import { EditorView, type NodeView } from 'prosemirror-view';

import styled from '@emotion/styled';

// import { StyledContainer } from '../editor-examples.styles';

/** footnote的定义，注意设计时footnote的序号和内容都不应该作为正文内容。
 * - atom与普通inline文本的区别，默认不可编辑，方向右键会选中节点而不是跳到下一个光标位置
 */
const footnoteSpec: NodeSpec = {
  group: 'inline',
  inline: true,
  content: 'inline*',
  // treat the node as a leaf, even though it technically has content
  atom: true,
  toDOM: () => ['footnote', 0],
  parseDOM: [{ tag: 'footnote' }],
};

const footnoteSchema = new Schema({
  nodes: schema.spec.nodes.addBefore('image', 'footnote', footnoteSpec),
  marks: schema.spec.marks,
});

const menu = buildMenuItems(footnoteSchema);
// 👉🏻 插入footnote时无需先选中文本，若先选中文本再点击插入，会将选中文本替换为脚注序号
menu.insertMenu.content.push(
  new MenuItem({
    title: 'Insert footnote',
    label: 'Footnote',
    select(state) {
      // 判断是否能够插入
      return (
        insertPoint(
          state.doc,
          state.selection.from,
          footnoteSchema.nodes.footnote,
        ) != null
      );
    },
    run(state, dispatch) {
      const { empty, $from, $to } = state.selection;
      let content = Fragment.empty;
      if (!empty && $from.sameParent($to) && $from.parent.inlineContent)
        content = $from.parent.content.cut(
          $from.parentOffset,
          $to.parentOffset,
        );
      dispatch(
        state.tr.replaceSelectionWith(
          footnoteSchema.nodes.footnote.create(null, content),
        ),
      );
    },
  }),
);

/** footnote默认会渲染成数字序号。 只有数字序号节点被选中时，才会出现弹框内容。
 * - nodeView未使用contentDOM，可完全定制渲染内容和更新逻辑
 * - Mod-z 和 y 按键被绑定到 父编辑器 的 undo 和 redo 功能上。
 *    - 效果是，修改完子编辑器内容后点击父编辑器立即按ctrl-z，此时会撤销子编辑的修改
 */
class FootnoteView implements NodeView {
  dom: HTMLElement;
  node: Node;
  /** 外层父编辑器 */
  outerView: EditorView;
  /** 选中数字节点时出现的弹框中的子编辑器。These are used when the footnote is selected */
  innerView: EditorView;
  getPos: () => number;

  constructor(node: Node, view: EditorView, getPos: () => number) {
    this.node = node;
    this.getPos = getPos;
    this.outerView = view;

    // The node's representation in the editor (empty, for now)
    this.dom = document.createElement('footnote');
    this.dom.classList.add('idNodeViewDom');
    this.innerView = null;
  }

  selectNode() {
    /** 选中数字序号节点时，触发内容弹框 */
    this.dom.classList.add('ProseMirror-selectednode');
    if (!this.innerView) this.open();
  }

  deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode');
    if (this.innerView) this.close();
  }

  /** 弹框的内容，直接就是一个单独的 pm-EditorView */
  open() {
    const innerContainer = this.dom.appendChild(document.createElement('div'));
    innerContainer.className = 'footnote-tooltip';
    // And put a sub-ProseMirror into that
    this.innerView = new EditorView(innerContainer, {
      state: EditorState.create({
        // 👉🏻 You can use any node as an editor document
        doc: this.node,
        plugins: [
          keymap({
            'Mod-z': () => undo(this.outerView.state, this.outerView.dispatch),
            'Mod-y': () => redo(this.outerView.state, this.outerView.dispatch),
          }),
        ],
      }),
      // This is the magic part
      dispatchTransaction: this.dispatchInner.bind(this),
      handleDOMEvents: {
        mousedown: () => {
          // Kludge to prevent issues due to the fact that the whole
          // footnote is node-selected (and thus DOM-selected) when
          // the parent editor is focused.
          // 为了避免出现问题，当父编辑器 focus 的时候，脚注的编辑器也要 focus。
          if (this.outerView.hasFocus()) {
            this.innerView.focus();
          }
        },
      },
    });
    // console.log(
    //   ';; 子编辑初始 ',
    //   this.innerView.state.selection.from,
    //   this.innerView.state.selection.to,
    //   this.innerView.state.selection,
    // );
    const sel = window.getSelection();
    // console.log(';; 子编辑初始window ', sel.anchorOffset, sel.focusOffset, sel);
  }

  close() {
    this.innerView.destroy();
    this.innerView = null;
    this.dom.textContent = '';
  }

  dispatchInner(tr: Transaction) {
    const { state, transactions } = this.innerView.state.applyTransaction(tr);
    // console.log(
    //   ';; 子编辑dispatch ',
    //   state.selection.from,
    //   state.selection.to,
    //   state.selection,
    // );

    this.innerView.updateState(state);

    if (!tr.getMeta('fromOutside')) {
      // /👉🏻子编辑器的内容更新时，也更新外部编辑器的内容
      const outerTr = this.outerView.state.tr;
      const offsetMap = StepMap.offset(this.getPos() + 1);
      for (let i = 0; i < transactions.length; i++) {
        const steps = transactions[i].steps;
        for (let j = 0; j < steps.length; j++)
          outerTr.step(steps[j].map(offsetMap));
      }
      if (outerTr.docChanged) this.outerView.dispatch(outerTr);
    }
  }

  update(node: Node) {
    // To be able to cleanly handle updates from outside (for example
    // through collaborative editing, or when the user undoes something, which is handled by the outer editor),
    // the node view's update method carefully finds the difference between its current content and the content of the new node.
    // It only replaces the changed part, in order to leave the cursor in place whenever possible.
    if (!node.sameMarkup(this.node)) return false;
    this.node = node;
    if (this.innerView) {
      const state = this.innerView.state;
      const start = node.content.findDiffStart(state.doc.content);
      if (start != null) {
        let { a: endA, b: endB } = node.content.findDiffEnd(state.doc.content);
        const overlap = start - Math.min(endA, endB);
        if (overlap > 0) {
          endA += overlap;
          endB += overlap;
        }
        // 👉🏻 每次只替换发生变化的部分
        this.innerView.dispatch(
          state.tr
            .replace(start, endB, node.slice(start, endA))
            .setMeta('fromOutside', true),
        );
      }
    }
    return true;
  }

  destroy() {
    if (this.innerView) this.close();
  }

  stopEvent(event: Event) {
    return (
      this.innerView && this.innerView.dom.contains(event.target as HTMLElement)
    );
  }

  ignoreMutation() {
    return true;
  }
}

/**
 * ✨ 官方编辑器示例，基于嵌套编辑器实现footnote 。
 * - https://prosemirror.net/examples/footnote/
 *
 * - 👉🏻 本示例要点
 * - footnote的弹框内容保存在外层父编辑器的数据模型上，数字序号通过css counter计算和::before添加
 * - 在中间插入footnote时，后面所有脚注序号的数字会自动更新，css counter容易实现正序，倒序需要指定初始值
 * - 分析父子编辑器的快捷键、数据更新处理
 * - 编辑器中序号标识node是atom，内容不可编辑，但可在外部通过退格删除
 * - 本地示例打开子编辑器时内容默认处于选中状态，因为::selection选择器未生效，之前修改源码导致
 * - ❓ 本地示例会显示红色下划线的拼写检查，但线上示例无
 */
export const FootnoteApp = () => {
  const editorContainer = useRef<HTMLDivElement>();
  const initialContentContainer = useRef<HTMLDivElement>();
  const view = useRef<EditorView>(null);

  useEffect(() => {
    const state = EditorState.create({
      doc: DOMParser.fromSchema(footnoteSchema).parse(
        initialContentContainer.current,
      ),
      plugins: exampleSetup({
        schema: footnoteSchema,
        menuContent: menu.fullMenu as MenuItem[][],
      }),
    });

    view.current = new EditorView(editorContainer.current, {
      state,
      nodeViews: {
        footnote(node, view, getPos) {
          return new FootnoteView(node, view, getPos);
        },
      },
    });

    // console.log(
    //   ';; 父编辑初始 ',
    //   view.current.state.selection.from,
    //   view.current.state.selection.to,
    //   view.current.state.selection,
    // );
    // applyDevTools(view.current, { devToolsExpanded: false });

    return () => view.current.destroy();
  }, []);

  return (
    <div>
      <div ref={editorContainer} id='editor' />
      {/* 👇🏻 剩下的全是默认隐藏的编辑器初始数据 */}
      <div ref={initialContentContainer} style={{ display: 'none' }}>
        <h3>Footnote in ProseMirror</h3>

        <p>
          This paragraph has a footnote
          <footnote>
            Which is a piece of text placed at the bottom of a page or chapter,
            providing additional <em>comments</em> or <em>citations</em>.
          </footnote>
          in it. And another<footnote>Some more footnote text.</footnote> one.
        </p>
        <p>Move onto or click on a footnote number to edit it.</p>
      </div>
    </div>
  );
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      footnote: React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

// const StyledDemoContainer = styled(StyledContainer)`
//   .ProseMirror {
//     // 定义一个counter名称
//     // counter-reset: reversed(prosemirror-footnote);
//     counter-reset: prosemirror-footnote;
//   }
//   footnote {
//     display: inline-block;
//     position: relative;
//     cursor: pointer;
//   }
//   footnote::after {
//     // counter-increment: revert;
//     // counter-increment: prosemirror-footnote-1;
//     counter-increment: prosemirror-footnote;
//     content: counter(prosemirror-footnote);
//     vertical-align: super;
//     font-size: 75%;
//   }
//   .ProseMirror-hideselection .footnote-tooltip *::selection {
//     background-color: transparent;
//   }
//   .ProseMirror-hideselection .footnote-tooltip *::-moz-selection {
//     background-color: transparent;
//   }
//   .footnote-tooltip {
//     cursor: auto;
//     position: absolute;
//     left: -30px;
//     top: calc(100% + 10px);
//     background: silver;
//     padding: 3px;
//     border-radius: 2px;
//     width: 500px;
//   }
//   .footnote-tooltip::before {
//     border: 5px solid silver;
//     border-top-width: 0px;
//     border-left-color: transparent;
//     border-right-color: transparent;
//     position: absolute;
//     top: -5px;
//     left: 27px;
//     content: ' ';
//     height: 0;
//     width: 0;
//   }
// `;
