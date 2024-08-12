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

/** define a subclass of WidgetType that draws the widget */
class CheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean) {
    super();
  }

  // When the view updates itself, if it finds it already has a drawn instance of
  // such a widget in the position where the widget occurs (using eq to determine equivalence), it will simply reuse that.
  eq(other: CheckboxWidget) {
    return other.checked === this.checked;
  }

  // wraps the checkbox in a <span> element, mostly because Firefox handles checkboxes
  // with contenteditable=false poorly
  toDOM() {
    const wrap = document.createElement('span');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.className = 'cm-boolean-toggle';
    const box = wrap.appendChild(document.createElement('input'));
    box.type = 'checkbox';
    box.checked = this.checked;
    return wrap;
  }

  // tells the editor to not ignore events that happen in the widget
  // This is necessary to allow an editor-wide event handler (defined later) to handle interaction with it.
  ignoreEvent() {
    return false;
  }
}

/** locate boolean literals in the visible editor parts and create widgets for them */
function createCheckboxes(view: EditorView) {
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

function toggleBooleanCmd(view: EditorView, pos: number) {
  const before = view.state.doc.sliceString(Math.max(0, pos - 5), pos);
  let change;
  if (before === 'false') {
    change = { from: pos - 5, to: pos, insert: 'true' };
  } else if (before.endsWith('true')) {
    change = { from: pos - 4, to: pos, insert: 'false' };
  } else {
    return false;
  }
  view.dispatch({ changes: change });
  return true;
}

// keeps an up-to-date decoration set as the document or viewport changes.
const checkboxPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createCheckboxes(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        syntaxTree(update.startState) !== syntaxTree(update.state)
      )
        this.decorations = createCheckboxes(update.view);
    }
  },
  {
    decorations: (v) => v.decorations,

    eventHandlers: {
      // as long as the plugin is active, the given mousedown should be registered. 
      mousedown: (e, view) => {
        const target = e.target as HTMLElement;
        if (
          target.nodeName === 'INPUT' &&
          target.parentElement!.classList.contains('cm-boolean-toggle')
        )
          return toggleBooleanCmd(view, view.posAtDOM(target));
      },
    },
  },
);

/**
 * a plugin that displays a checkbox widget next to boolean literals
 * - Widget decorations don't directly contain their widget DOM.
 */
export const DecoWidgetCheckbox = () => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
