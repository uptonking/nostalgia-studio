import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { Decoration, type DecorationSet, keymap } from '@codemirror/view';
import {
  StateField,
  StateEffect,
  type ChangeDesc,
  Compartment,
} from '@codemirror/state';
import { invertedEffects } from '@codemirror/commands';

const highlightDeco = Decoration.mark({
  attributes: { style: `background-color: rgba(255, 50, 0, 0.3)` },
});

/**
 *  highlighted ranges, addRange/cutRange is used to make sure our range set doesn't contain overlapping or needlessly fragmented ranges
 */
const highlightedRangesState = StateField.define({
  create() {
    return Decoration.none;
  },
  update(ranges, tr) {
    ranges = ranges.map(tr.changes);
    for (const ef of tr.effects) {
      if (ef.is(addHighlight)) {
        ranges = addRange(ranges, ef.value);
      } else if (ef.is(removeHighlight)) {
        ranges = cutRange(ranges, ef.value);
      }
    }
    return ranges;
  },
  provide: (field) => EditorView.decorations.from(field),
});

/** 只是作为stateField.update方法的参数 */
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

/**
 * only creates effects for previously highlighted ranges that overlap the selection.
 * - If we had simply created them for the entire selected ranges, inverting those effects could cause things to be highlighted that were not previously highlighted.
 */
function unhighlightSelection(view: EditorView) {
  const highlighted = view.state.field(highlightedRangesState);
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
    add: [highlightDeco.range(r.from, r.to)],
  });
}

/**
 * The function we give to `invertedEffects` is called for every transaction, and
 * returns an array of effects that the history should store alongside the inverse of that transaction.
 */
const invertHighlight = invertedEffects.of((tr) => {
  const found = [];
  for (const e of tr.effects) {
    if (e.is(addHighlight)) found.push(removeHighlight.of(e.value));
    else if (e.is(removeHighlight)) found.push(addHighlight.of(e.value));
  }
  // because deleting a region around a highlight also deletes the highlight, and
  // we might want to restore them when undoing the deletion
  const ranges = tr.startState.field(highlightedRangesState);
  tr.changes.iterChangedRanges((chFrom, chTo) => {
    ranges.between(chFrom, chTo, (rFrom, rTo) => {
      const from = Math.max(chFrom, rFrom);
      const to = Math.min(chTo, rTo);
      if (from < to) found.push(addHighlight.of({ from, to }));
    });
  });
  return found;
});

const highlightKeymap = keymap.of([
  { key: 'Mod-h', run: highlightSelection },
  { key: 'Shift-Mod-h', run: unhighlightSelection },
]);

export function rangeHighlightingExt() {
  return [highlightedRangesState, invertHighlight, highlightKeymap];
}

/**
 * ✨ an example of an extension that allows the user to highlight parts of the document, and undo that highlighting.
 * - By default, the history extension only tracks changes to the document and selection
 * - https://codemirror.net/examples/inverted-effect/
 */
export const UndoableEffectsUndo = () => {
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
      extensions: [basicSetup, rangeHighlightingExt()],
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
