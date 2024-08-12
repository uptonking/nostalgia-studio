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
  '&light .cm-zebraStripe': { backgroundColor: '#88C0D0' },
  '&dark .cm-zebraStripe': { backgroundColor: '#1a2727' },
});

const stripeDeco = Decoration.line({
  attributes: { class: 'cm-zebraStripe' },
});

/** view plugin that actually adds the .cm-zebraStripe styling */
const showStripesPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = createStripeDeco(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        // /simply recompute its decorations every time something changes
        this.decorations = createStripeDeco(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

/** The facet takes any number of step values
 */
const stepSize = Facet.define<number, number>({
  // even if multiple instances of the extension are added
  combine: (values) => (values.length ? Math.min(...values) : 2),
});

// extension values can be individual extensions (such as facet values, created with of), or arrays,
// possibly nested, of extensions. Thus they can be easily composed into bigger extensions.
export function zebraStripes(options: { step?: number } = {}): Extension {
  return [
    baseTheme,
    options.step == null ? [] : stepSize.of(options.step),
    showStripesPlugin,
  ];
}



/** iterates over the visible lines, creating a line decoration for every Nth line */
function createStripeDeco(view: EditorView) {
  const step = view.state.facet(stepSize);
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to;) {
      const line = view.state.doc.lineAt(pos);
      if (line.number % step === 0) {
        builder.add(line.from, line.from, stripeDeco);
      }
      pos = line.to + 1;
    }
  }
  return builder.finish();
}

/**
 * This example defines an extension that styles every Nth line with a background.
 * - The plugin will simply recompute its decorations every time something changes
 * - In other cases, it can be preferable to preserve decorations (mapping them through document changes) across updates.
 */
export const DecoLineZebra = () => {
  const content = `# CodeMirror v6

This is an cm example at 20240806

## Lists

- apple
- banana
- another fruit


- aa
- bb
- cc

## Links

[Some Link](https://example.org)
`;

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      // extensions: [basicSetup, language.of(markdown())],
      extensions: [zebraStripes({ step: 3 }), keymap.of(defaultKeymap)],
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
