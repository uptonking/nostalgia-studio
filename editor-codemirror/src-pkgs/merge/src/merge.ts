import { EditorView } from '@codemirror/view';
import {
  type EditorState,
  EditorSelection,
  Facet,
  StateEffect,
  StateField,
  type StateCommand,
} from '@codemirror/state';
import type { Chunk } from './chunk';

type Config = {
  sibling?: () => EditorView;
  markGutter: boolean;
  showTypewriterAnimation: boolean;
  highlightChanges: boolean;
  syntaxHighlightDeletions?: boolean;
  mergeControls?: boolean;
  side: 'a' | 'b';
};

export const mergeConfig = Facet.define<Config, Config>({
  combine: (values) => values[0],
});

export const setChunks = StateEffect.define<readonly Chunk[]>();

export const ChunkField = StateField.define<readonly Chunk[]>({
  create(state) {
    return null as any;
  },
  update(current, tr) {
    for (const e of tr.effects) if (e.is(setChunks)) current = e.value;
    return current;
  },
});

/// Get the changed chunks for the merge view that this editor is part
/// of, plus the side it is on if it is part of a `MergeView`. Returns
/// null if the editor doesn't have a merge extension active or the
/// merge view hasn't finished initializing yet.
export function getChunks(state: EditorState) {
  const field = state.field(ChunkField, false);
  if (!field) return null;
  const conf = state.facet(mergeConfig);
  return { chunks: field, side: conf ? conf.side : null };
}

const moveByChunk =
  (dir: -1 | 1): StateCommand =>
  ({ state, dispatch }) => {
    const chunks = state.field(ChunkField, false);
    const conf = state.facet(mergeConfig);
    if (!chunks || !chunks.length || !conf) return false;
    const { head } = state.selection.main;
    let pos = 0;
    for (let i = chunks.length - 1; i >= 0; i--) {
      const chunk = chunks[i];
      const [from, to] =
        conf.side == 'b' ? [chunk.fromB, chunk.toB] : [chunk.fromA, chunk.toA];
      if (to < head) {
        pos = i + 1;
        break;
      }
      if (from <= head) {
        if (chunks.length == 1) return false;
        pos = i + (dir < 0 ? 0 : 1);
        break;
      }
    }
    const next =
      chunks[(pos + (dir < 0 ? chunks.length - 1 : 0)) % chunks.length];
    const [from, to] =
      conf.side == 'b' ? [next.fromB, next.toB] : [next.fromA, next.toA];
    dispatch(
      state.update({
        selection: { anchor: from },
        userEvent: 'select.byChunk',
        effects: EditorView.scrollIntoView(EditorSelection.range(to, from)),
      }),
    );
    return true;
  };

/// Move the selection to the next changed chunk.
export const goToNextChunk = moveByChunk(1);

/// Move the selection to the previous changed chunk.
export const goToPreviousChunk = moveByChunk(-1);
