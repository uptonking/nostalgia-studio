import {
  type Extension,
  EditorSelection,
  type EditorState,
  countColumn,
  findColumn,
} from '@codemirror/state';
import { EditorView } from './editorview';
import type { MouseSelectionStyle } from './input';
import { ViewPlugin } from './extension';

type Pos = { line: number; col: number; off: number };

// Don't compute precise column positions for line offsets above this
// (since it could get expensive). Assume offset==column for them.
const MaxOff = 2000;

function rectangleFor(state: EditorState, a: Pos, b: Pos) {
  const startLine = Math.min(a.line, b.line);
  const endLine = Math.max(a.line, b.line);
  const ranges = [];
  if (a.off > MaxOff || b.off > MaxOff || a.col < 0 || b.col < 0) {
    const startOff = Math.min(a.off, b.off);
    const endOff = Math.max(a.off, b.off);
    for (let i = startLine; i <= endLine; i++) {
      const line = state.doc.line(i);
      if (line.length <= endOff)
        ranges.push(
          EditorSelection.range(line.from + startOff, line.to + endOff),
        );
    }
  } else {
    const startCol = Math.min(a.col, b.col);
    const endCol = Math.max(a.col, b.col);
    for (let i = startLine; i <= endLine; i++) {
      const line = state.doc.line(i);
      const start = findColumn(line.text, startCol, state.tabSize, true);
      if (start < 0) {
        ranges.push(EditorSelection.cursor(line.to));
      } else {
        const end = findColumn(line.text, endCol, state.tabSize);
        ranges.push(EditorSelection.range(line.from + start, line.from + end));
      }
    }
  }
  return ranges;
}

function absoluteColumn(view: EditorView, x: number) {
  const ref = view.coordsAtPos(view.viewport.from);
  return ref
    ? Math.round(Math.abs((ref.left - x) / view.defaultCharacterWidth))
    : -1;
}

function getPos(view: EditorView, event: MouseEvent) {
  const offset = view.posAtCoords(
    { x: event.clientX, y: event.clientY },
    false,
  );
  const line = view.state.doc.lineAt(offset);
  const off = offset - line.from;
  const col =
    off > MaxOff
      ? -1
      : off == line.length
        ? absoluteColumn(view, event.clientX)
        : countColumn(line.text, view.state.tabSize, offset - line.from);
  return { line: line.number, col, off };
}

function rectangleSelectionStyle(view: EditorView, event: MouseEvent) {
  let start = getPos(view, event)!;
  let startSel = view.state.selection;
  if (!start) return null;
  return {
    update(update) {
      if (update.docChanged) {
        const newStart = update.changes.mapPos(
          update.startState.doc.line(start.line).from,
        );
        const newLine = update.state.doc.lineAt(newStart);
        start = {
          line: newLine.number,
          col: start.col,
          off: Math.min(start.off, newLine.length),
        };
        startSel = startSel.map(update.changes);
      }
    },
    get(event, _extend, multiple) {
      const cur = getPos(view, event);
      if (!cur) return startSel;
      const ranges = rectangleFor(view.state, start, cur);
      if (!ranges.length) return startSel;
      if (multiple)
        return EditorSelection.create(ranges.concat(startSel.ranges));
      else return EditorSelection.create(ranges);
    },
  } as MouseSelectionStyle;
}

/// Create an extension that enables rectangular selections. By
/// default, it will react to left mouse drag with the Alt key held
/// down. When such a selection occurs, the text within the rectangle
/// that was dragged over will be selected, as one selection
/// [range](#state.SelectionRange) per line.
export function rectangularSelection(options?: {
  /// A custom predicate function, which takes a `mousedown` event and
  /// returns true if it should be used for rectangular selection.
  eventFilter?: (event: MouseEvent) => boolean;
}): Extension {
  const filter = options?.eventFilter || ((e) => e.altKey && e.button == 0);
  return EditorView.mouseSelectionStyle.of((view, event) =>
    filter(event) ? rectangleSelectionStyle(view, event) : null,
  );
}

const keys: {
  [key: string]: [number, (event: KeyboardEvent | MouseEvent) => boolean];
} = {
  Alt: [18, (e) => Boolean(e.altKey)],
  Control: [17, (e) => Boolean(e.ctrlKey)],
  Shift: [16, (e) => Boolean(e.shiftKey)],
  Meta: [91, (e) => Boolean(e.metaKey)],
};

const showCrosshair = { style: 'cursor: crosshair' };

/// Returns an extension that turns the pointer cursor into a
/// crosshair when a given modifier key, defaulting to Alt, is held
/// down. Can serve as a visual hint that rectangular selection is
/// going to happen when paired with
/// [`rectangularSelection`](#view.rectangularSelection).
export function crosshairCursor(
  options: {
    key?: 'Alt' | 'Control' | 'Shift' | 'Meta';
  } = {},
): Extension {
  const [code, getter] = keys[options.key || 'Alt'];
  const plugin = ViewPlugin.fromClass(
    class {
      isDown = false;
      constructor(readonly view: EditorView) {}
      set(isDown: boolean) {
        if (this.isDown != isDown) {
          this.isDown = isDown;
          this.view.update([]);
        }
      }
    },
    {
      eventObservers: {
        keydown(e) {
          this.set(e.keyCode == code || getter(e));
        },
        keyup(e) {
          if (e.keyCode == code || !getter(e)) this.set(false);
        },
        mousemove(e) {
          this.set(getter(e));
        },
      },
    },
  );
  return [
    plugin,
    EditorView.contentAttributes.of((view) =>
      view.plugin(plugin)?.isDown ? showCrosshair : null,
    ),
  ];
}
