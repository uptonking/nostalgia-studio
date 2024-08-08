import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import { Compartment } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  MatchDecorator,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view';

const placeholderMatcher = new MatchDecorator({
  regexp: /\[\[(\w+)\]\]/g,
  decoration: (match) =>
    Decoration.replace({
      widget: new PlaceholderWidget(match[1]),
    }),
});

const placeholders = ViewPlugin.fromClass(
  class {
    placeholders: DecorationSet;
    constructor(view: EditorView) {
      this.placeholders = placeholderMatcher.createDeco(view);
    }
    update(update: ViewUpdate) {
      this.placeholders = placeholderMatcher.updateDeco(
        update,
        this.placeholders,
      );
    }
  },
  {
    decorations: (instance) => instance.placeholders,
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => {
        return view.plugin(plugin)?.placeholders || Decoration.none;
      }),
  },
);

class PlaceholderWidget extends WidgetType {
  constructor(readonly name: string) {
    super();
  }
  eq(other: PlaceholderWidget) {
    return this.name == other.name;
  }
  toDOM() {
    const elt = document.createElement('span');
    elt.style.cssText = `
        border: 1px solid blue;
        border-radius: 4px;
        padding: 0 3px;
        background: lightblue;`;
    elt.textContent = this.name;
    return elt;
  }
  ignoreEvent() {
    return false;
  }
}

export const DecoAtomicRanges = () => {
  const content = `# CodeMirror v6

This is an [[codemirror]] example at 20240806

## Lists

- apple
- banana
- another [[fruit]]

## Links

[Some Link](https://example.org)
`;

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      extensions: [basicSetup, language.of(markdown()), placeholders],
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
