import '../styles/editor-examples.css';

import React, { useEffect, useRef } from 'react';

// import { applyDevTools } from 'prosemirror-dev-toolkit';
import { exampleSetup } from 'prosemirror-example-setup';
import { DOMParser, type Node } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import {
  type Command,
  EditorState,
  Plugin,
  TextSelection,
} from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';

// import { StyledContainer } from '../editor-examples.styles';

/** Words you probably shouldn't use.
 * - `\b` 匹配一个单词的边界
 */
const badWords = /\b(obviously|clearly|evidently|simply|slate|ckeditor)\b/gi;
/** Matches punctuation with a space before it */
const badPunc = / ([,\.!?:]) ?/g;

type CommandParams = {
  state: Parameters<Command>[0];
  dispatch: Parameters<Command>[1];
};

type ProblemItem = {
  msg: string;
  from: number;
  to: number;
  fix?: (args: any) => (args2: CommandParams) => void;
};

/** get an array of problems found in the document */
function lint(doc: Node) {
  const result = [] as ProblemItem[];
  let lastHeadLevel = null as null | number;

  // eslint-disable-next-line max-params
  function problemRecord(msg, from, to, fix) {
    result.push({ msg, from, to, fix });
  }

  // 👉🏻 use `descendants()` to iterate over all nodes in a document.
  // ❓ 如何在一个节点内检查heading级别是否跳跃
  doc.descendants((node, pos) => {
    if (node.isText) {
      // Scan text nodes for suspicious patterns
      // /基于正则 regexp.exec(str)，遍历匹配项，记录badWords/Punc
      let m: RegExpExecArray;
      while ((m = badWords.exec(node.text))) {
        problemRecord(
          `Try not to say '${m[0]}'`,
          pos + m.index,
          pos + m.index + m[0].length,
          undefined,
        );
      }
      while ((m = badPunc.exec(node.text))) {
        problemRecord(
          'Suspicious spacing around punctuation',
          pos + m.index,
          pos + m.index + m[0].length,
          fixPunc(m[1] + ' '),
        );
      }
    }
    if (node.type.name === 'heading') {
      // Check whether heading levels fit under the current level
      const level = node.attrs.level;
      // `null + 1` 的值为1，这里只检查当前heading值比上一个大的情况
      if (lastHeadLevel != null && level > lastHeadLevel + 1)
        problemRecord(
          `Heading too small (${level} under ${lastHeadLevel})`,
          pos + 1,
          pos + 1 + node.content.size,
          fixHeader(lastHeadLevel + 1),
        );
      lastHeadLevel = level;
    }
    if (node.type.name === 'image' && !node.attrs.alt) {
      // Ensure images have alt text
      problemRecord('Image without alt text', pos, pos + 1, addAlt);
    }
  });

  return result;
}

/** 用replacement替换原来有问题的部分，这里是去掉标点前空格并在标签后加空格 */
function fixPunc(replacement: string) {
  return function ({ state, dispatch }: CommandParams) {
    dispatch(
      // @ts-ignore
      state.tr.replaceWith(this.from, this.to, state.schema.text(replacement)),
    );
  };
}

/** 将标题字体变大一级 */
function fixHeader(level) {
  return function ({ state, dispatch }: CommandParams) {
    // @ts-ignore
    dispatch(state.tr.setNodeMarkup(this.from - 1, null, { level }));
  };
}

/** 给文字添加alt描述文字 */
function addAlt({ state, dispatch }: CommandParams) {
  const alt = prompt('Alt text', '');
  if (alt) {
    // @ts-ignore
    const attrs = { ...state.doc.nodeAt(this.from).attrs, alt };
    // @ts-ignore
    dispatch(state.tr.setNodeMarkup(this.from, null, attrs));
  }
}

function createLintSideDecos(doc: Node) {
  const decos = [] as Decoration[];
  lint(doc).forEach((problem) => {
    decos.push(
      // 在问题位置加上浅红色背景和红色下划线
      Decoration.inline(problem.from, problem.to, { class: 'problem' }),
      // 在问题所在行，通过 position:absolute 在该行最右侧显示lint操作图标
      Decoration.widget(problem.from, createLintIcon(problem)),
    );
  });
  return DecorationSet.create(doc, decos);
}

/** 作为widget decoration，这里将问题数据保存在了dom对象属性上 */
function createLintIcon(problem: ProblemItem) {
  const icon = document.createElement('div');
  icon.className = 'lint-icon';
  icon.title = problem.msg;
  // @ts-ignore
  icon.problem = problem;
  return icon;
}

const lintPlugin = new Plugin({
  state: {
    init(_, { doc }) {
      return createLintSideDecos(doc);
    },
    apply(tr, old) {
      return tr.docChanged ? createLintSideDecos(tr.doc) : old;
    },
  },
  props: {
    decorations(state) {
      return this.getState(state);
    },
    handleClick(view, _, event) {
      const element = event.target as HTMLDivElement;
      if (/lint-icon/.test(element.className)) {
        // @ts-ignore
        const { from, to } = element.problem;
        view.dispatch(
          view.state.tr
            .setSelection(TextSelection.create(view.state.doc, from, to))
            .scrollIntoView(),
        );
        return true;
      }
      return false;
    },
    handleDoubleClick(view, _, event) {
      const element = event.target as HTMLDivElement;
      if (/lint-icon/.test(element.className)) {
        // @ts-ignore
        const prob = element.problem;
        if (prob.fix) {
          prob.fix(view);
          view.focus();
          return true;
        }
      }
      return false;
    },
  },
});

/**
 * ✨ 官方编辑器示例，基于decoration实现lint 。
 * - https://prosemirror.net/examples/lint/
 * - 🔨 每次更新都会重新计算问题节点并创建decorations，待优化，根据tr中的信息
 *
 * - 👉🏻 本示例要点
 * - 右侧操作图标基于decoration实现，绝对定位相对于xx节点，物理上是夹杂在编辑器dom中间的
 * - 问题相关数据都保存在dom对象上
 */
export const LintApp = () => {
  const editorContainer = useRef<HTMLDivElement>();
  const initialContentContainer = useRef<HTMLDivElement>();
  const view = useRef<EditorView>(null);

  useEffect(() => {
    const state = EditorState.create({
      doc: DOMParser.fromSchema(schema).parse(initialContentContainer.current),
      plugins: exampleSetup({
        schema,
      }).concat(lintPlugin),
    });

    view.current = new EditorView(editorContainer.current, {
      state,
    });
    // applyDevTools(view.current, { devToolsExpanded: false });

    return () => view.current.destroy();
  }, []);

  return (
    <div>
      <div ref={editorContainer} id='editor' />
      {/* 👇🏻 剩下的全是默认隐藏的编辑器初始数据 */}
      <div ref={initialContentContainer} style={{ display: 'none' }}>
        <h3>Lint in ProseMirror: 单击侧边选中内容，双击侧边修复问题</h3>

        <p>This is ! a sentence ,but the comma isn't in ? the right place.</p>
        <h5>Too-minor header</h5>
        <p>
          This is an image <img src='/img/smiley.png' /> without alt text. You
          can hover over the icons on the right to see what the problem is,
          click them to select the relevant text, and, obviously, double-click
          them to automatically fix it (if supported).
        </p>
      </div>
    </div>
  );
};

// const StyledDemoContainer = styled(StyledContainer)`
//   #editor {
//     position: relative;
//   }
//   .problem {
//     background: #fdd;
//     border-bottom: 1px solid #f22;
//     margin-bottom: -1px;
//   }
//   .lint-icon {
//     display: inline-block;
//     position: absolute;
//     right: 2px;
//     cursor: pointer;
//     border-radius: 100px;
//     background: #f22;
//     color: white;
//     font-family: times, georgia, serif;
//     font-size: 15px;
//     font-weight: bold;
//     width: 1.1em;
//     height: 1.1em;
//     text-align: center;
//     padding-left: 0.5px;
//     line-height: 1.1em;
//   }
//   .lint-icon:before {
//     content: '!';
//   }
//   .ProseMirror {
//     padding-right: 20px;
//   }
// `;
