import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import {
  ViewPlugin,
  type ViewUpdate,
  Decoration,
  type DecorationSet,
  keymap,
} from '@codemirror/view';
import {
  StateField,
  StateEffect,
  type ChangeDesc,
  Compartment,
  type Extension,
  RangeSetBuilder,
  Facet,
} from '@codemirror/state';
import { invertedEffects } from '@codemirror/commands';

const addHighlight = StateEffect.define<{ from: number; to: number }>({
  map: mapRange,
});
const removeHighlight = StateEffect.define<{ from: number; to: number }>({
  map: mapRange,
});

function mapRange(range: { from: number; to: number }, change: ChangeDesc) {
  const from = change.mapPos(range.from);
  const to = change.mapPos(range.to);
  return from < to ? { from, to } : undefined;
}

function highlightSelection(view: EditorView) {
  view.dispatch({
    effects: view.state.selection.ranges
      .filter((r) => !r.empty)
      .map((r) => addHighlight.of(r)),
  });
  return true;
}

function unhighlightSelection(view: EditorView) {
  const highlighted = view.state.field(highlightedRanges);
  const effects = [];
  for (const sel of view.state.selection.ranges) {
    highlighted.between(sel.from, sel.to, (rFrom, rTo) => {
      const from = Math.max(sel.from, rFrom);
      const to = Math.min(sel.to, rTo);
      if (from < to) effects.push(removeHighlight.of({ from, to }));
    });
  }
  view.dispatch({ effects });
  return true;
}

const highlight = Decoration.mark({
  attributes: { style: `background-color: rgba(255, 50, 0, 0.3)` },
});

const highlightedRanges = StateField.define({
  create() {
    return Decoration.none;
  },
  update(ranges, tr) {
    ranges = ranges.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(addHighlight)) ranges = addRange(ranges, e.value);
      else if (e.is(removeHighlight)) ranges = cutRange(ranges, e.value);
    }
    return ranges;
  },
  provide: (field) => EditorView.decorations.from(field),
});

function cutRange(ranges: DecorationSet, r: { from: number; to: number }) {
  const leftover = [];
  ranges.between(r.from, r.to, (from, to, deco) => {
    if (from < r.from) leftover.push(deco.range(from, r.from));
    if (to > r.to) leftover.push(deco.range(r.to, to));
  });
  return ranges.update({
    filterFrom: r.from,
    filterTo: r.to,
    filter: () => false,
    add: leftover,
  });
}

function addRange(ranges: DecorationSet, r: { from: number; to: number }) {
  ranges.between(r.from, r.to, (from, to) => {
    if (from < r.from) r = { from, to: r.to };
    if (to > r.to) r = { from: r.from, to };
  });
  return ranges.update({
    filterFrom: r.from,
    filterTo: r.to,
    filter: () => false,
    add: [highlight.range(r.from, r.to)],
  });
}

const invertHighlight = invertedEffects.of((tr) => {
  const found = [];
  for (const e of tr.effects) {
    if (e.is(addHighlight)) found.push(removeHighlight.of(e.value));
    else if (e.is(removeHighlight)) found.push(addHighlight.of(e.value));
  }
  const ranges = tr.startState.field(highlightedRanges);
  tr.changes.iterChangedRanges((chFrom, chTo) => {
    ranges.between(chFrom, chTo, (rFrom, rTo) => {
      if (rFrom >= chFrom || rTo <= chTo) {
        const from = Math.max(chFrom, rFrom);
        const to = Math.min(chTo, rTo);
        if (from < to) found.push(addHighlight.of({ from, to }));
      }
    });
  });
  return found;
});

const highlightKeymap = keymap.of([
  { key: 'Mod-h', run: highlightSelection },
  { key: 'Shift-Mod-h', run: unhighlightSelection },
]);

export function rangeHighlighting() {
  return [highlightedRanges, invertHighlight, highlightKeymap];
}

export const UndoableEffects = () => {
  const content = `# CodeMirror v6

This is an cm example at 20240806

Select something and press ctrl/cmd-h to highlight it
or shift-ctrl/cmd-h to remove highlighting.
Try undoing and redoing a highlight action.

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
      extensions: [basicSetup, rangeHighlighting()],
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
