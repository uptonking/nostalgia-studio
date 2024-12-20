import {
  type Text,
  StateField,
  type Range,
  EditorSelection,
} from '@codemirror/state';
import {
  EditorView,
  Decoration,
  type DecorationSet,
  Direction,
} from '@codemirror/view';
import { ConflictWidget } from './widgets';

export class ConflictSide {
  constructor(
    readonly text: string,
    readonly label: string,
  ) {}
}

export class Conflict {
  constructor(
    readonly ours: ConflictSide,
    readonly theirs: ConflictSide,
    readonly base: ConflictSide | null,
  ) {}
}

const enum State {
  Before,
  Ours,
  Base,
  Theirs,
  Done,
}

class Match {
  state = State.Before;
  ourLabel = '';
  ourText: string[] = [];
  theirLabel = '';
  theirText: string[] = [];
  baseLabel: null | string = null;
  baseText: string[] = [];
  startPos = -1;

  constructor(public pos: number) {}

  finish() {
    return new Conflict(
      new ConflictSide(this.ourText.join('\n'), this.ourLabel),
      new ConflictSide(this.theirText.join('\n'), this.theirLabel),
      this.baseLabel == null
        ? null
        : new ConflictSide(this.baseText.join('\n'), this.baseLabel),
    );
  }

  matchLine(line: string) {
    let m;
    if (this.state == State.Before) {
      if ((m = /^<{7} (.+)/.exec(line))) {
        this.startPos = this.pos;
        this.ourLabel = m[1];
        this.state = State.Ours;
      }
    } else if (this.state == State.Ours) {
      if ((m = /^\|{7} (.+)/.exec(line))) {
        this.baseLabel = m[1];
        this.state = State.Base;
      } else if ((m = /^={7}$/.exec(line))) {
        this.state = State.Theirs;
      } else {
        this.ourText.push(line);
      }
    } else if (this.state == State.Base) {
      if ((m = /^={7}$/.exec(line))) {
        this.state = State.Theirs;
      } else {
        this.baseText.push(line);
      }
    } else {
      if ((m = /^>{7} (.+)/.exec(line))) {
        this.state = State.Done;
        this.theirLabel = m[1];
      } else {
        this.theirText.push(line);
      }
    }
    this.pos += line.length + 1;
    return this.state == State.Done;
  }
}

function matchConflicts(doc: Text) {
  const deco: Range<Decoration>[] = [];
  const iter = doc.iterLines();
  let match = new Match(0);
  while (!iter.next().done) {
    if (match.matchLine(iter.value)) {
      deco.push(
        Decoration.replace({
          widget: new ConflictWidget(match.finish()),
          block: true,
        }).range(match.startPos, match.pos - 1),
      );
      match = new Match(match.pos);
    }
  }
  return Decoration.set(deco);
}

function hasConflictMarker(doc: Text, from: number, to: number) {
  const iter = doc.iterLines(
    doc.lineAt(from).number,
    doc.lineAt(to).number + 1,
  );
  while (!iter.next().done)
    if (/^(<{7} |\|{7} |>{7} |={7}$)/.test(iter.value)) return true;
  return false;
}

export const conflicts = StateField.define<DecorationSet>({
  create: (s) => matchConflicts(s.doc),
  update(conflicts, tr) {
    if (tr.changes.empty) return conflicts;
    const del: number[] = [];
    let recompute = false;
    tr.changes.iterChangedRanges((fromA, toA, fromB, toB) => {
      if (hasConflictMarker(tr.state.doc, fromB, toB)) recompute = true;
      conflicts.between(fromA, toA, (cFrom, cTo) => {
        if (cFrom <= toA && cTo >= fromA) del.push(cFrom);
      });
    });
    return recompute
      ? matchConflicts(tr.state.doc)
      : (del.length
          ? conflicts.update({ filter: (from) => del.indexOf(from) == -1 })
          : conflicts
        ).map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

export function acceptAllConflicts(
  view: EditorView,
  side: 'ours' | 'base' | 'theirs',
) {
  const field = view.state.field(conflicts, false);
  if (!field || !field.size) return false;
  const changes: { from: number; to: number; insert: string }[] = [];
  field.between(0, view.state.doc.length, (from, to, deco) => {
    const { conflict } = deco.spec.widget as ConflictWidget;
    const chunk = conflict[side];
    if (chunk) changes.push({ from, to, insert: chunk.text });
  });
  view.dispatch({ changes, userEvent: 'conflict.accept.all.' + side });
  view.focus();
  return true;
}

export function deleteAllConflicts(view: EditorView) {
  const field = view.state.field(conflicts, false);
  if (!field || !field.size) return false;
  const changes: { from: number; to: number }[] = [];
  field.between(0, view.state.doc.length, (from, to) => {
    changes.push({ from, to });
  });
  view.dispatch({ changes, userEvent: 'conflict.delete.all' });
  view.focus();
  return true;
}

function selectConflict(
  view: EditorView,
  userEvent: string,
  select: (conflicts: { from: number; to: number }[]) => number,
) {
  const field = view.state.field(conflicts, false);
  if (!field || !field.size) return false;
  const ranges: { from: number; to: number }[] = [];
  field.between(0, view.state.doc.length, (from, to) => {
    ranges.push({ from, to });
  });
  const range = ranges[select(ranges)];
  view.dispatch({
    selection: { anchor: range.from },
    userEvent: 'select.conflict.' + userEvent,
    effects: EditorView.scrollIntoView(
      EditorSelection.range(range.from, range.to),
    ),
  });
  focusConflict(view, range.from);
  return true;
}

export function selectFirstConflict(view: EditorView) {
  return selectConflict(view, 'first', () => 0);
}

export function selectLastConflict(view: EditorView) {
  return selectConflict(view, 'last', (rs) => rs.length - 1);
}

export function selectNextConflict(view: EditorView) {
  const { head } = view.state.selection.main;
  return selectConflict(view, 'next', (rs) =>
    Math.max(
      0,
      rs.findIndex((r) => r.from > head),
    ),
  );
}

export function selectPrevConflict(view: EditorView) {
  const { head } = view.state.selection.main;
  return selectConflict(view, 'next', (ranges) => {
    let found = ranges.length - 1;
    for (let i = 0; i < ranges.length; i++) if (ranges[i].to < head) found = i;
    return found;
  });
}

function focusConflict(view: EditorView, pos: number) {
  const { node, offset } = view.domAtPos(pos);
  const dom = node.childNodes[offset];
  (dom.firstChild as HTMLElement).focus();
}

function moveToConflict(view: EditorView, forward: boolean, vertical: boolean) {
  const { main } = view.state.selection;
  if (!main.empty) return false;
  const field = view.state.field(conflicts, false);
  if (!field || !field.size) return false;
  const line = view.state.doc.lineAt(main.head);
  if (vertical) {
    const next = view.moveVertically(main, forward);
    if (next.head >= line.from && next.head <= line.to) return false;
  } else {
    if (main.head - line.from != (forward ? line.text.length : 0)) return false;
  }
  const pos = forward ? line.to + 1 : line.from - 1;
  let hasConflict = -1;
  field.between(pos, pos, (from) => {
    hasConflict = from;
  });
  if (hasConflict < 0) return false;
  focusConflict(view, hasConflict);
  return true;
}

export function moveDownToConflict(view: EditorView) {
  return moveToConflict(view, true, true);
}

export function moveUpToConflict(view: EditorView) {
  return moveToConflict(view, false, true);
}

export function moveLeftToConflict(view: EditorView) {
  return moveToConflict(view, view.textDirection != Direction.LTR, false);
}

export function moveRightToConflict(view: EditorView) {
  return moveToConflict(view, view.textDirection == Direction.LTR, false);
}
