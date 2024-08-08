import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { Compartment } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  WidgetType,
  type ViewUpdate,
  ViewPlugin,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { javascript } from '@codemirror/lang-javascript';

class CheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean) {
    super();
  }

  eq(other: CheckboxWidget) {
    return other.checked === this.checked;
  }

  toDOM() {
    const wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.className = 'cm-boolean-toggle';
    const box = wrap.appendChild(document.createElement('input'));
    box.type = 'checkbox';
    box.checked = this.checked;
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

function checkboxes(view: EditorView) {
  const widgets = [];
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (node.name === 'BooleanLiteral') {
          const isTrue =
            view.state.doc.sliceString(node.from, node.to) === 'true';
          const deco = Decoration.widget({
            widget: new CheckboxWidget(isTrue),
            side: 1,
          });
          widgets.push(deco.range(node.to));
        }
      },
    });
  }
  return Decoration.set(widgets);
}

function toggleBoolean(view: EditorView, pos: number) {
  const before = view.state.doc.sliceString(Math.max(0, pos - 5), pos);
  let change;
  if (before === 'false') change = { from: pos - 5, to: pos, insert: 'true' };
  else if (before.endsWith('true'))
    change = { from: pos - 4, to: pos, insert: 'false' };
  else return false;
  view.dispatch({ changes: change });
  return true;
}

const checkboxPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = checkboxes(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        syntaxTree(update.startState) !== syntaxTree(update.state)
      )
        this.decorations = checkboxes(update.view);
    }
  },
  {
    decorations: (v) => v.decorations,

    eventHandlers: {
      mousedown: (e, view) => {
        const target = e.target as HTMLElement;
        if (
          target.nodeName === 'INPUT' &&
          target.parentElement!.classList.contains('cm-boolean-toggle')
        )
          return toggleBoolean(view, view.posAtDOM(target));
      },
    },
  },
);

export const DecoWidgetCheckbox = () => {

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      // extensions: [basicSetup, language.of(markdown())],
      // doc: content,
      doc: 'let value = true\nif (!value == false)\n  console.log("good")\n',
      // extensions: [checkboxPlugin, basicSetup, javascript()],
      extensions: [basicSetup, checkboxPlugin, javascript()],
      parent: editorRef.current,
    });
    window['edd'] = editor;

    return () => {
      editor.destroy();
      window['edd'] = undefined;
    };
  }, []);

  return (
    <div className='idCMEditor'>
      <div ref={editorRef} />
    </div>
  );
};
