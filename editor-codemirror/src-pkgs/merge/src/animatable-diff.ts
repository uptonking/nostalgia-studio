import { highlightingFor, language } from '@codemirror/language';
import {
  ChangeSet,
  EditorState,
  Prec,
  RangeSet,
  RangeSetBuilder,
  StateEffect,
  StateField,
  Text,
} from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  EditorView,
  gutter,
  GutterMarker,
  WidgetType,
} from '@codemirror/view';
import { highlightTree } from '@lezer/highlight';

import { Chunk, defaultDiffConfig } from './chunk';
import { decorateChunks } from './deco';
import type { Change, DiffConfig } from './diff';
import { ChunkField, mergeConfig, setChunks } from './merge';
import { baseTheme } from './theme';

interface AnimatableDiffViewConfig {
  /** original document to compare with */
  original: Text | string;
  /** whether to show highlighted gutter on the changed line. default is true. */
  gutter?: boolean;
  /** whether to show typewriter animation for inserted lines. default is false. */
  showDiffAnimation?: boolean;
  /** whether to highlight the inserted/deleted characters. default is true. */
  highlightChanges?: boolean;
  /** whether to highlight deleted line using original lang syntax.  */
  syntaxHighlightDeletions?: boolean;
  /** whether to show accept/reject buttons for each changed chunk. default is true. */
  mergeControls?: boolean;
  /** options to the diff algorithm */
  diffConfig?: DiffConfig;
}

const deletedChunkGutterMarker = new (class extends GutterMarker {
  elementClass = 'cm-deletedLineGutter';
})();

const diffChangeGutter = Prec.low(
  gutter({
    class: 'cm-changeGutter',
    markers: (view) => view.plugin(decorateChunks)?.gutter || RangeSet.empty,
    widgetMarker: (view, widget) =>
      widget instanceof DeletionWidget ? deletedChunkGutterMarker : null,
  }),
);

/** Create an extension that makes the editor show diff changes
 * between its document and the original document.
 *
 * todo make diff animation pausable
 */
export function animatableDiffView(config: AnimatableDiffViewConfig) {
  const orig =
    typeof config.original === 'string'
      ? Text.of(config.original.split(/\r?\n/))
      : config.original;
  const diffConf = config.diffConfig || defaultDiffConfig;

  return [
    Prec.low(decorateChunks),
    deletedChunks,
    baseTheme,
    EditorView.editorAttributes.of({ class: 'cm-merge-b' }),
    EditorState.transactionExtender.of((tr) => {
      const updateDoc = tr.effects.find((e) => e.is(updateOriginalDoc));
      if (!tr.docChanged && !updateDoc) return null;
      const prev = tr.startState.field(ChunkField);
      const chunks = updateDoc
        ? Chunk.updateA(
            prev,
            updateDoc.value.doc,
            tr.newDoc,
            updateDoc.value.changes,
            diffConf,
          )
        : Chunk.updateB(
            prev,
            tr.startState.field(originalDoc),
            tr.newDoc,
            tr.changes,
            diffConf,
          );
      return { effects: setChunks.of(chunks) };
    }),
    mergeConfig.of({
      highlightChanges: config.highlightChanges !== false,
      markGutter: config.gutter !== false,
      syntaxHighlightDeletions: config.syntaxHighlightDeletions !== false,
      mergeControls: config.mergeControls !== false,
      side: 'b',
    }),
    originalDoc.init(() => orig),
    config.gutter !== false ? diffChangeGutter : [],
    ChunkField.init((state) => Chunk.build(orig, state.doc, diffConf)),
  ];
}

/// The state effect used to signal changes in the original doc in a
/// unified merge view.
export const updateOriginalDoc = StateEffect.define<{
  doc: Text;
  changes: ChangeSet;
}>();

/// Create an effect that, when added to a transaction on a unified
/// merge view, will update the original document that's being compared against.
export function originalDocChangeEffect(
  state: EditorState,
  changes: ChangeSet,
): StateEffect<{ doc: Text; changes: ChangeSet }> {
  return updateOriginalDoc.of({
    doc: changes.apply(getOriginalDoc(state)),
    changes,
  });
}

const originalDoc = StateField.define<Text>({
  create: () => Text.empty,
  update(doc, tr) {
    for (const e of tr.effects) if (e.is(updateOriginalDoc)) doc = e.value.doc;
    return doc;
  },
});

/// Get the original document from a unified merge editor's state.
export function getOriginalDoc(state: EditorState): Text {
  return state.field(originalDoc);
}

const DeletionWidgets: WeakMap<readonly Change[], Decoration> = new WeakMap();

class DeletionWidget extends WidgetType {
  dom: HTMLElement | null = null;
  readonly buildDOM: (view: EditorView) => HTMLElement;

  constructor(buildDOM: (view: EditorView) => HTMLElement) {
    super();
    this.buildDOM = buildDOM;
  }

  eq(other: DeletionWidget) {
    return this.dom === other.dom;
  }

  toDOM(view: EditorView) {
    return this.dom || (this.dom = this.buildDOM(view));
  }
}

function deletionWidget(state: EditorState, chunk: Chunk) {
  const known = DeletionWidgets.get(chunk.changes);
  if (known) return known;

  const buildDOM = (view: EditorView) => {
    const { highlightChanges, syntaxHighlightDeletions, mergeControls } =
      state.facet(mergeConfig);
    const text = view.state
      .field(originalDoc)
      .sliceString(chunk.fromA, chunk.endA);
    const lang = syntaxHighlightDeletions && state.facet(language);
    const dom = document.createElement('div');
    dom.className = 'cm-deletedChunk';
    if (mergeControls) {
      const buttons = dom.appendChild(document.createElement('div'));
      buttons.className = 'cm-chunkButtons';
      const accept = buttons.appendChild(document.createElement('button'));
      accept.name = 'accept';
      accept.textContent = state.phrase('Accept');
      accept.onmousedown = (e) => {
        e.preventDefault();
        acceptChunk(view, view.posAtDOM(dom));
      };
      const reject = buttons.appendChild(document.createElement('button'));
      reject.name = 'reject';
      reject.textContent = state.phrase('Reject');
      reject.onmousedown = (e) => {
        e.preventDefault();
        rejectChunk(view, view.posAtDOM(dom));
      };
    }

    const content = dom.appendChild(document.createElement('del'));
    const changes = chunk.changes;
    let changeI = 0;
    let inside = false;
    function add(from: number, to: number, cls: string) {
      for (let at = from; at < to; ) {
        let nextStop = to;
        const nodeCls = cls + (inside ? ' cm-deletedText' : '');
        let flip = false;
        if (highlightChanges && changeI < changes.length) {
          const nextBound = Math.max(
            0,
            inside ? changes[changeI].toA : changes[changeI].fromA,
          );
          if (nextBound <= nextStop) {
            nextStop = nextBound;
            if (inside) changeI++;
            flip = true;
          }
        }
        if (nextStop > at) {
          const node = document.createTextNode(text.slice(at, nextStop));
          if (nodeCls) {
            const span = content.appendChild(document.createElement('span'));
            span.className = nodeCls;
            span.appendChild(node);
          } else {
            content.appendChild(node);
          }
        }
        at = nextStop;
        if (flip) inside = !inside;
      }
    }

    if (lang) {
      const tree = lang.parser.parse(text);
      let pos = 0;
      highlightTree(
        tree,
        { style: (tags) => highlightingFor(state, tags) },
        (from, to, cls) => {
          if (from > pos) add(pos, from, '');
          add(from, to, cls);
          pos = to;
        },
      );
      add(pos, text.length, '');
    } else {
      add(0, text.length, '');
    }
    return dom;
  };
  const deco = Decoration.widget({
    block: true,
    side: -1,
    widget: new DeletionWidget(buildDOM),
  });
  DeletionWidgets.set(chunk.changes, deco);
  return deco;
}

/// In a [unified](#merge.unifiedMergeView) merge view, accept the
/// chunk under the given position or the cursor. This chunk will no
/// longer be highlighted unless it is edited again.
export function acceptChunk(view: EditorView, pos?: number) {
  const { state } = view;
  const at = pos ?? state.selection.main.head;
  const chunk = view.state
    .field(ChunkField)
    .find((ch) => ch.fromB <= at && ch.endB >= at);
  if (!chunk) return false;
  let insert = view.state.sliceDoc(
    chunk.fromB,
    Math.max(chunk.fromB, chunk.toB - 1),
  );
  const orig = view.state.field(originalDoc);
  if (chunk.fromB != chunk.toB && chunk.toA <= orig.length)
    insert += view.state.lineBreak;
  const changes = ChangeSet.of(
    { from: chunk.fromA, to: Math.min(orig.length, chunk.toA), insert },
    orig.length,
  );
  view.dispatch({
    effects: updateOriginalDoc.of({ doc: changes.apply(orig), changes }),
    userEvent: 'accept',
  });
  return true;
}

/// In a [unified](#merge.unifiedMergeView) merge view, reject the
/// chunk under the given position or the cursor. Reverts that range
/// to the content it has in the original document.
export function rejectChunk(view: EditorView, pos?: number) {
  const { state } = view;
  const at = pos ?? state.selection.main.head;
  const chunk = state
    .field(ChunkField)
    .find((ch) => ch.fromB <= at && ch.endB >= at);
  if (!chunk) return false;
  const orig = state.field(originalDoc);
  let insert = orig.sliceString(
    chunk.fromA,
    Math.max(chunk.fromA, chunk.toA - 1),
  );
  if (chunk.fromA != chunk.toA && chunk.toB <= state.doc.length)
    insert += state.lineBreak;
  view.dispatch({
    changes: {
      from: chunk.fromB,
      to: Math.min(state.doc.length, chunk.toB),
      insert,
    },
    userEvent: 'revert',
  });
  return true;
}

function buildDeletedChunks(state: EditorState) {
  const builder = new RangeSetBuilder<Decoration>();
  for (const ch of state.field(ChunkField))
    builder.add(ch.fromB, ch.fromB, deletionWidget(state, ch));
  return builder.finish();
}

const deletedChunks = StateField.define<DecorationSet>({
  create: (state) => buildDeletedChunks(state),
  update(deco, tr) {
    return tr.state.field(ChunkField, false) !=
      tr.startState.field(ChunkField, false)
      ? buildDeletedChunks(tr.state)
      : deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});
