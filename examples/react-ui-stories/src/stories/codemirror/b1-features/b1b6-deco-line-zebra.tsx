// import '../styles/decorations.scss';

import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import {
  ViewPlugin,
  type ViewUpdate,
  keymap,
  Decoration,
  type DecorationSet,
} from '@codemirror/view';
import {
  StateField,
  StateEffect,
  Compartment,
  type Extension,
  RangeSetBuilder,
  Facet,
} from '@codemirror/state';

import { defaultKeymap } from '@codemirror/commands';

const baseTheme = EditorView.baseTheme({
  '&light .cm-zebraStripe': { backgroundColor: '#d4fafa' },
  '&dark .cm-zebraStripe': { backgroundColor: '#1a2727' },
});

const showStripes = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = stripeDeco(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged)
        this.decorations = stripeDeco(update.view);
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

const stepSize = Facet.define<number, number>({
  combine: (values) => (values.length ? Math.min(...values) : 2),
});

export function zebraStripes(options: { step?: number } = {}): Extension {
  return [
    baseTheme,
    options.step == null ? [] : stepSize.of(options.step),
    showStripes,
  ];
}

const stripe = Decoration.line({
  attributes: { class: 'cm-zebraStripe' },
  // attributes: {
  //   // style: 'background-color: #d2ffff',
  //   class: 'cm-line-typewriter',
  // },
});

function stripeDeco(view: EditorView) {
  const step = view.state.facet(stepSize);
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);
      if (line.number % step === 0) builder.add(line.from, line.from, stripe);
      pos = line.to + 1;
    }
  }
  return builder.finish();
}

export const DecoLineZebra = () => {
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
      // extensions: [basicSetup, language.of(markdown())],
      extensions: [zebraStripes(), keymap.of(defaultKeymap)],
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
