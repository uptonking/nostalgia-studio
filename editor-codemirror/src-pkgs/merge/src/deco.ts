import {
  EditorView,
  Decoration,
  type DecorationSet,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
  GutterMarker,
  gutter,
} from '@codemirror/view';
import {
  type EditorState,
  RangeSetBuilder,
  type Text,
  StateField,
  StateEffect,
  RangeSet,
  Prec,
  EditorSelection,
} from '@codemirror/state';
import type { Chunk } from './chunk';
import { ChunkField, mergeConfig } from './merge';
import {
  autoPlayDiffEffect,
  diffPlayControllerState,
  diffPlayStateChanged,
  resetDiffPlayState,
  setIsDiffCompleted,
} from './animation-controller';
import {
  getChangedLineDeco,
  getInsertedDeco,
  getIntervalDurationPerLine,
  MIN_TYPEWRITER_DURATION_PER_LINE,
} from './utils';
import { animatableDiffViewCompartment } from './diff-actions';

/**
 * decorate chunks with line/mark decorations
 */
export const decorateChunks = ViewPlugin.fromClass(
  class {
    editView: EditorView;

    deco: DecorationSet;
    gutter: RangeSet<GutterMarker> | null;

    autoPlayIntervalId = 0;

    chunksByLine: Chunk[] = [];

    constructor(view: EditorView) {
      this.editView = view;
      const { showTypewriterAnimation } =
        this.editView.state.facet(mergeConfig);
      // 🧐 only computed on constructor, not on update; not work for diff-off2on
      this.chunksByLine = showTypewriterAnimation
        ? splitChunksByLine(view)
        : [];
      ({ deco: this.deco, gutter: this.gutter } = getChunkDeco(
        view,
        this.chunksByLine,
      ));
      console.log(
        ';; ins-deco-ctor ',
        view.state.field(ChunkField),
        this.chunksByLine,
      );

      if (
        showTypewriterAnimation &&
        this.autoPlayIntervalId === 0 &&
        this.chunksByLine.length > 0
      ) {
        console.log(';; startDiffTimer-ctor');
        this.autoPlayDiffAnimation();
      }
    }

    update(update: ViewUpdate) {
      const diffPlayState = this.editView.state.field(
        diffPlayControllerState,
        false,
      );
      const { showTypewriterAnimation } =
        this.editView.state.facet(mergeConfig);

      let chunks = this.editView.state.field(ChunkField) as Chunk[];
      if (showTypewriterAnimation && !diffPlayState?.isDiffCompleted) {
        // if (showTypewriterAnimation) {
        chunks = this.chunksByLine;
      }

      if (!showTypewriterAnimation) {
        if (diffPlayState?.isDiffCompleted) {
          queueMicrotask(() => {
            console.log(';; clean completed ');
            this.cleanAutoPlayDiffTimer();
          });
        }
      }

      const shouldUpdate =
        update.docChanged ||
        update.viewportChanged ||
        chunksChanged(update.startState, update.state) ||
        configChanged(update.startState, update.state) ||
        diffPlayStateChanged(update.startState, update.state);

      // console.log(';; ins-deco-up ', shouldUpdate, diffPlayState);
      if (shouldUpdate) {
        ({ deco: this.deco, gutter: this.gutter } = getChunkDeco(
          update.view,
          chunks,
        ));
      }

      if (
        showTypewriterAnimation &&
        this.autoPlayIntervalId === 0 &&
        this.chunksByLine.length > 0 &&
        !diffPlayState?.isDiffCompleted
      ) {
        console.log(';; startDiffTimer-update');
        this.autoPlayDiffAnimation();
      }
    }

    autoPlayDiffAnimation() {
      const {
        showTypewriterAnimation,
        showAnimeWithDiffOff,
        lineAnimeDuration,
        totalAnimeDuration,
      } = this.editView.state.facet(mergeConfig);
      let lineDuration = showTypewriterAnimation
        ? getIntervalDurationPerLine(
            this.chunksByLine.length,
            totalAnimeDuration,
          )
        : 0;
      if (lineDuration > 0) {
        if (lineAnimeDuration > lineDuration) {
          lineDuration = lineAnimeDuration;
        }
        if (this.chunksByLine.length === 1) {
          lineDuration = MIN_TYPEWRITER_DURATION_PER_LINE * 2;
        }
      }
      console.log(
        ';; typing-lines-interval ',
        this.chunksByLine.length,
        lineDuration,
      );

      this.autoPlayIntervalId = window.setInterval(() => {
        if (!showTypewriterAnimation) {
          this.cleanAutoPlayDiffTimer();
          return;
        }

        const diffPlayState = this.editView.state.field(
          diffPlayControllerState,
        );
        const currentDiffPlayLineNumber = diffPlayState.playLineNumber;

        // console.log(
        //   ';; autoPlay ',
        //   currentDiffPlayLineNumber,
        //   this.chunksByLine.length,
        // );
        if (currentDiffPlayLineNumber < this.chunksByLine.length - 1) {
          const nextChunk =
            this.chunksByLine[
              currentDiffPlayLineNumber < 0 ? 0 : currentDiffPlayLineNumber + 1
            ];
          if (nextChunk) {
            this.editView.dispatch({
              effects: [
                EditorView.scrollIntoView(
                  nextChunk.fromB,
                  // EditorSelection.range(nextChunk.fromB, nextChunk.toB), // full
                ),
                autoPlayDiffEffect.of(1),
              ],
            });
          }
        } else {
          window.clearInterval(this.autoPlayIntervalId);
          this.autoPlayIntervalId = 0;
          const animeEndEffects: StateEffect<unknown>[] = [
            setIsDiffCompleted.of(true),
          ];
          if (showAnimeWithDiffOff) {
            animeEndEffects.push(animatableDiffViewCompartment.reconfigure([]));
          }
          this.editView.dispatch({
            effects: animeEndEffects,
            // [
            //   setIsDiffCompleted.of(true),
            //   // setDiffPlayLineNumber.of(-10),
            // ],
          });
          // console.log(';; autoPlay completed ');
        }
      }, lineDuration);
    }

    destroy() {
      // this.cleanAutoPlayDiffTimer(); // not work
      queueMicrotask(() => {
        this.cleanAutoPlayDiffTimer();
      });
    }

    cleanAutoPlayDiffTimer() {
      window.clearInterval(this.autoPlayIntervalId);
      this.autoPlayIntervalId = 0;
      this.editView.dispatch({
        effects: [resetDiffPlayState.of(1)],
      });
    }
  },
  {
    decorations: (d) => d.deco,
  },
);

function splitChunksByLine(view: EditorView) {
  const chunks = view.state.field(ChunkField);
  const chunksByLine: Chunk[] = [];
  chunks.forEach((chunk) => {
    const chunkStartLineNumber = view.state.doc.lineAt(chunk.fromB).number;
    const chunkEndLineNumber = view.state.doc.lineAt(chunk.endB).number;
    // console.log(';; chk ', chunkStartLineNumber, chunkEndLineNumber, chunk);
    if (chunkStartLineNumber === chunkEndLineNumber) {
      // @ts-expect-error fix-types
      chunk.lineNumber = chunkStartLineNumber;
      chunksByLine.push(chunk);
    } else {
      for (
        let index = chunkStartLineNumber;
        index < chunkEndLineNumber + 1;
        index++
      ) {
        const currentLine = view.state.doc.line(index);
        const lineChunk: Chunk = JSON.parse(JSON.stringify(chunk));
        // @ts-expect-error fix-types
        lineChunk.lineNumber = index;
        lineChunk.fromB = currentLine.from;
        lineChunk.toB = currentLine.to;
        chunksByLine.push(lineChunk);
      }
    }
  });
  return chunksByLine;
}

export const changeGutter = Prec.low(
  gutter({
    class: 'cm-changeGutter',
    markers: (view) => view.plugin(decorateChunks)?.gutter || RangeSet.empty,
  }),
);

function chunksChanged(s1: EditorState, s2: EditorState) {
  return s1.field(ChunkField, false) != s2.field(ChunkField, false);
}

function configChanged(s1: EditorState, s2: EditorState) {
  return s1.facet(mergeConfig) != s2.facet(mergeConfig);
}

const changedTextDeco = Decoration.mark({ class: 'cm-changedText' });
const insertedDeco = Decoration.mark({
  tagName: 'ins',
  class: 'cm-insertedLine',
});
const deletedDeco = Decoration.mark({
  tagName: 'del',
  class: 'cm-deletedLine',
});

const changedLineGutterMarker = new (class extends GutterMarker {
  elementClass = 'cm-changedLineGutter';
})();

function buildChunkDeco({
  chunk,
  doc,
  isA,
  highlight,
  builder,
  gutterBuilder,
  displayStatus,
  showAnimeWithDiffOff,
  lineDuration,
}: {
  chunk: Chunk;
  doc: Text;
  isA: boolean;
  highlight: boolean;
  builder: RangeSetBuilder<Decoration>;
  gutterBuilder: RangeSetBuilder<GutterMarker> | null;
  displayStatus: 'show' | 'typing' | 'hidden';
  showAnimeWithDiffOff?: boolean;
  lineDuration?: number;
}) {
  const from = isA ? chunk.fromA : chunk.fromB;
  const to = isA ? chunk.toA : chunk.toB;
  let changeI = 0;
  if (from !== to) {
    builder.add(
      from,
      from,
      getChangedLineDeco(displayStatus, showAnimeWithDiffOff),
    );
    // builder.add(from, to, isA ? deletedDeco : insertedDeco);
    builder.add(
      from,
      to,
      isA
        ? deletedDeco
        : getInsertedDeco(displayStatus, to - from + 1, lineDuration),
    );
    if (gutterBuilder) {
      gutterBuilder.add(from, from, changedLineGutterMarker);
    }
    // console.log(
    //   ';; buildChunkDeco ',
    //   chunk.lineNumber,
    //   displayStatus,
    //   to - from + 1,
    //   from,
    //   to,
    //   chunk,
    // );
    for (
      let iter = doc.iterRange(from, to - 1), pos = from;
      !iter.next().done;

    ) {
      if (iter.lineBreak) {
        pos++;
        builder.add(
          pos,
          pos,
          getChangedLineDeco(displayStatus, showAnimeWithDiffOff),
        );
        if (gutterBuilder) gutterBuilder.add(pos, pos, changedLineGutterMarker);
        continue;
      }
      const lineEnd = pos + iter.value.length;
      if (highlight)
        while (changeI < chunk.changes.length) {
          const nextChange = chunk.changes[changeI];
          const nextFrom = from + (isA ? nextChange.fromA : nextChange.fromB);
          const nextTo = from + (isA ? nextChange.toA : nextChange.toB);
          const chFrom = Math.max(pos, nextFrom);
          const chTo = Math.min(lineEnd, nextTo);
          if (chFrom < chTo) builder.add(chFrom, chTo, changedTextDeco);
          if (nextTo < lineEnd) changeI++;
          else break;
        }
      pos = lineEnd;
    }
  }
}

function getChunkDeco(view: EditorView, chunksByLine?: Chunk[]) {
  const {
    side,
    highlightChanges,
    markGutter,
    showTypewriterAnimation,
    showAnimeWithDiffOff,
    totalAnimeDuration,
    lineAnimeDuration,
  } = view.state.facet(mergeConfig);
  const diffPlayState = view.state.field(diffPlayControllerState, false);
  const currentDiffPlayLineNumber = diffPlayState.playLineNumber ?? -1e9;
  const isDiffCompleted = diffPlayState?.isDiffCompleted;
  let chunks = view.state.field(ChunkField);
  if (
    showTypewriterAnimation &&
    Array.isArray(chunksByLine) &&
    !isDiffCompleted
  ) {
    chunks = chunksByLine;
  }
  let lineDuration = showTypewriterAnimation
    ? getIntervalDurationPerLine(chunks.length, totalAnimeDuration)
    : 0;
  if (lineDuration > 0 && lineAnimeDuration > lineDuration) {
    lineDuration = lineAnimeDuration;
  }
  // console.log(
  //   ';; chunks ',
  //   side,
  //   isDiffCompleted,
  //   currentDiffPlayLineNumber,
  //   // chunks,
  // );

  const isA = side === 'a';
  const builder = new RangeSetBuilder<Decoration>();
  const gutterBuilder = markGutter ? new RangeSetBuilder<GutterMarker>() : null;
  const { from, to } = view.viewport;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if ((isA ? chunk.fromA : chunk.fromB) >= to) break;
    if ((isA ? chunk.toA : chunk.toB) > from) {
      let displayStatus: 'show' | 'hidden' | 'typing' = 'show';
      if (showTypewriterAnimation && !isDiffCompleted) {
        if (i === currentDiffPlayLineNumber) {
          displayStatus = 'typing';
        } else if (
          i > currentDiffPlayLineNumber ||
          currentDiffPlayLineNumber < 0
        ) {
          displayStatus = 'hidden';
        }
      }
      buildChunkDeco({
        chunk: chunk,
        doc: view.state.doc,
        isA,
        highlight: highlightChanges,
        builder,
        gutterBuilder,
        displayStatus,
        showAnimeWithDiffOff,
        lineDuration,
      });
    }
  }
  return {
    deco: builder.finish(),
    gutter: gutterBuilder && gutterBuilder.finish(),
  };
}

class Spacer extends WidgetType {
  constructor(readonly height: number) {
    super();
  }

  eq(other: Spacer) {
    return this.height == other.height;
  }

  toDOM() {
    const elt = document.createElement('div');
    elt.className = 'cm-mergeSpacer';
    elt.style.height = this.height + 'px';
    return elt;
  }

  updateDOM(dom: HTMLElement) {
    dom.style.height = this.height + 'px';
    return true;
  }

  get estimatedHeight() {
    return this.height;
  }

  ignoreEvent() {
    return false;
  }
}

export const adjustSpacers = StateEffect.define<DecorationSet>({
  map: (value, mapping) => value.map(mapping),
});

export const Spacers = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update: (spacers, tr) => {
    for (const e of tr.effects) if (e.is(adjustSpacers)) return e.value;
    return spacers.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

const epsilon = 0.01;

function compareSpacers(a: DecorationSet, b: DecorationSet) {
  if (a.size != b.size) return false;
  const iA = a.iter();
  const iB = b.iter();
  while (iA.value) {
    if (
      iA.from != iB.from ||
      Math.abs(
        (iA.value.spec.widget as Spacer).height -
          (iB.value!.spec.widget as Spacer).height,
      ) > 1
    )
      return false;
    iA.next();
    iB.next();
  }
  return true;
}

export function updateSpacers(
  a: EditorView,
  b: EditorView,
  chunks: readonly Chunk[],
) {
  const buildA = new RangeSetBuilder<Decoration>();
  const buildB = new RangeSetBuilder<Decoration>();
  const spacersA = a.state.field(Spacers).iter();
  const spacersB = b.state.field(Spacers).iter();
  let posA = 0;
  let posB = 0;
  let offA = 0;
  let offB = 0;
  const vpA = a.viewport;
  const vpB = b.viewport;
  chunks: for (let chunkI = 0; ; chunkI++) {
    const chunk = chunkI < chunks.length ? chunks[chunkI] : null;
    const endA = chunk ? chunk.fromA : a.state.doc.length;
    const endB = chunk ? chunk.fromB : b.state.doc.length;
    // A range at posA/posB is unchanged, must be aligned.
    if (posA < endA) {
      const heightA = a.lineBlockAt(posA).top + offA;
      const heightB = b.lineBlockAt(posB).top + offB;
      const diff = heightA - heightB;
      if (diff < -epsilon) {
        offA -= diff;
        buildA.add(
          posA,
          posA,
          Decoration.widget({
            widget: new Spacer(-diff),
            block: true,
            side: -1,
          }),
        );
      } else if (diff > epsilon) {
        offB += diff;
        buildB.add(
          posB,
          posB,
          Decoration.widget({
            widget: new Spacer(diff),
            block: true,
            side: -1,
          }),
        );
      }
    }
    // If the viewport starts inside the unchanged range (on both
    // sides), add another sync at the top of the viewport. That way,
    // big unchanged chunks with possibly inaccurate estimated heights
    // won't cause the content to misalign (#1408)
    if (
      endA > posA + 1000 &&
      posA < vpA.from &&
      endA > vpA.from &&
      posB < vpB.from &&
      endB > vpB.from
    ) {
      const off = Math.min(vpA.from - posA, vpB.from - posB);
      posA += off;
      posB += off;
      chunkI--;
    } else if (!chunk) {
      break;
    } else {
      posA = chunk.toA;
      posB = chunk.toB;
    }
    while (spacersA.value && spacersA.from < posA) {
      offA -= (spacersA.value.spec.widget as Spacer).height;
      spacersA.next();
    }
    while (spacersB.value && spacersB.from < posB) {
      offB -= (spacersB.value.spec.widget as Spacer).height;
      spacersB.next();
    }
  }
  while (spacersA.value) {
    offA -= (spacersA.value.spec.widget as any).height;
    spacersA.next();
  }
  while (spacersB.value) {
    offB -= (spacersB.value.spec.widget as any).height;
    spacersB.next();
  }
  const docDiff = a.contentHeight + offA - (b.contentHeight + offB);
  if (docDiff < epsilon) {
    buildA.add(
      a.state.doc.length,
      a.state.doc.length,
      Decoration.widget({
        widget: new Spacer(-docDiff),
        block: true,
        side: 1,
      }),
    );
  } else if (docDiff > epsilon) {
    buildB.add(
      b.state.doc.length,
      b.state.doc.length,
      Decoration.widget({
        widget: new Spacer(docDiff),
        block: true,
        side: 1,
      }),
    );
  }

  const decoA = buildA.finish();
  const decoB = buildB.finish();
  if (!compareSpacers(decoA, a.state.field(Spacers)))
    a.dispatch({ effects: adjustSpacers.of(decoA) });
  if (!compareSpacers(decoB, b.state.field(Spacers)))
    b.dispatch({ effects: adjustSpacers.of(decoB) });
}

const uncollapse = StateEffect.define<number>({
  map: (value, change) => change.mapPos(value),
});

class CollapseWidget extends WidgetType {
  constructor(readonly lines: number) {
    super();
  }

  eq(other: CollapseWidget) {
    return this.lines == other.lines;
  }

  toDOM(view: EditorView) {
    const outer = document.createElement('div');
    outer.className = 'cm-collapsedLines';
    outer.textContent =
      '⦚ ' + view.state.phrase('$ unchanged lines', this.lines) + ' ⦚';
    outer.addEventListener('click', (e) => {
      const pos = view.posAtDOM(e.target as HTMLElement);
      view.dispatch({ effects: uncollapse.of(pos) });
      const { side, sibling } = view.state.facet(mergeConfig);
      if (sibling)
        sibling().dispatch({
          effects: uncollapse.of(
            mapPos(pos, view.state.field(ChunkField), side == 'a'),
          ),
        });
    });
    return outer;
  }

  ignoreEvent(e: Event) {
    return e instanceof MouseEvent;
  }

  get estimatedHeight() {
    return 27;
  }
}

function mapPos(pos: number, chunks: readonly Chunk[], isA: boolean) {
  let startOur = 0;
  let startOther = 0;
  for (let i = 0; ; i++) {
    const next = i < chunks.length ? chunks[i] : null;
    if (!next || (isA ? next.fromA : next.fromB) >= pos)
      return startOther + (pos - startOur);
    [startOur, startOther] = isA ? [next.toA, next.toB] : [next.toB, next.toA];
  }
}

const CollapsedRanges = StateField.define<DecorationSet>({
  create(state) {
    return Decoration.none;
  },
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects)
      if (e.is(uncollapse))
        deco = deco.update({ filter: (from) => from != e.value });
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export function collapseUnchanged({
  margin = 3,
  minSize = 4,
}: {
  margin?: number;
  minSize?: number;
}) {
  return CollapsedRanges.init((state) =>
    buildCollapsedRanges(state, margin, minSize),
  );
}

function buildCollapsedRanges(
  state: EditorState,
  margin: number,
  minLines: number,
) {
  const builder = new RangeSetBuilder<Decoration>();
  const isA = state.facet(mergeConfig).side === 'a';
  const chunks = state.field(ChunkField);
  let prevLine = 1;
  for (let i = 0; ; i++) {
    const chunk = i < chunks.length ? chunks[i] : null;
    const collapseFrom = i ? prevLine + margin : 1;
    const collapseTo = chunk
      ? state.doc.lineAt(isA ? chunk.fromA : chunk.fromB).number - 1 - margin
      : state.doc.lines;
    const lines = collapseTo - collapseFrom + 1;
    if (lines >= minLines) {
      builder.add(
        state.doc.line(collapseFrom).from,
        state.doc.line(collapseTo).to,
        Decoration.replace({
          widget: new CollapseWidget(lines),
          block: true,
        }),
      );
    }
    if (!chunk) break;
    prevLine = state.doc.lineAt(
      Math.min(state.doc.length, isA ? chunk.toA : chunk.toB),
    ).number;
  }
  return builder.finish();
}
