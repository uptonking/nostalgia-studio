import type { Text, ChangeDesc } from '@codemirror/state';
import { type Change, presentableDiff, type DiffConfig } from './diff';

/// A chunk describes a range of lines which have changed content in
/// them. Either side (a/b) may either be empty (when its `to` is
/// equal to its `from`), or points at a range starting at the start
/// of the first changed line, to 1 past the end of the last changed
/// line. Note that `to` positions may point past the end of the
/// document. Use `endA`/`endB` if you need an end position that is
/// certain to be a valid document position.
export class Chunk {
  constructor(
    /// The individual changes inside this chunk. These are stored
    /// relative to the start of the chunk, so you have to add
    /// `chunk.fromA`/`fromB` to get document positions.
    readonly changes: readonly Change[],
    /// The start of the chunk in document A.
    readonly fromA: number,
    /// The end of the chunk in document A. This is equal to `fromA`
    /// when the chunk covers no lines in document A, or is one unit
    /// past the end of the last line in the chunk if it does.
    readonly toA: number,
    /// The start of the chunk in document B.
    readonly fromB: number,
    /// The end of the chunk in document A.
    readonly toB: number,
  ) {}

  /// @internal
  offset(offA: number, offB: number) {
    return offA || offB
      ? new Chunk(
          this.changes,
          this.fromA + offA,
          this.toA + offA,
          this.fromB + offB,
          this.toB + offB,
        )
      : this;
  }

  /// Returns `fromA` if the chunk is empty in A, or the end of the
  /// last line in the chunk otherwise.
  get endA() {
    return Math.max(this.fromA, this.toA - 1);
  }
  /// Returns `fromB` if the chunk is empty in B, or the end of the
  /// last line in the chunk otherwise.
  get endB() {
    return Math.max(this.fromB, this.toB - 1);
  }

  /// Build a set of changed chunks for the given documents.
  static build(a: Text, b: Text, conf?: DiffConfig): readonly Chunk[] {
    return toChunks(
      presentableDiff(a.toString(), b.toString(), conf),
      a,
      b,
      0,
      0,
    );
  }

  /// Update a set of chunks for changes in document A. `a` should
  /// hold the updated document A.
  static updateA(
    chunks: readonly Chunk[],
    a: Text,
    b: Text,
    changes: ChangeDesc,
    conf?: DiffConfig,
  ) {
    return updateChunks(
      findRangesForChange(chunks, changes, true, b.length),
      chunks,
      a,
      b,
      conf,
    );
  }

  /// Update a set of chunks for changes in document B.
  static updateB(
    chunks: readonly Chunk[],
    a: Text,
    b: Text,
    changes: ChangeDesc,
    conf?: DiffConfig,
  ) {
    return updateChunks(
      findRangesForChange(chunks, changes, false, a.length),
      chunks,
      a,
      b,
      conf,
    );
  }
}

function fromLine(fromA: number, fromB: number, a: Text, b: Text) {
  const lineA = a.lineAt(fromA);
    const lineB = b.lineAt(fromB);
  return lineA.to == fromA &&
    lineB.to == fromB &&
    fromA < a.length &&
    fromB < b.length
    ? [fromA + 1, fromB + 1]
    : [lineA.from, lineB.from];
}

function toLine(toA: number, toB: number, a: Text, b: Text) {
  const lineA = a.lineAt(toA);
    const lineB = b.lineAt(toB);
  return lineA.from == toA && lineB.from == toB
    ? [toA, toB]
    : [lineA.to + 1, lineB.to + 1];
}

function toChunks(
  changes: readonly Change[],
  a: Text,
  b: Text,
  offA: number,
  offB: number,
) {
  const chunks = [];
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    const [fromA, fromB] = fromLine(
      change.fromA + offA,
      change.fromB + offB,
      a,
      b,
    );
    let [toA, toB] = toLine(change.toA + offA, change.toB + offB, a, b);
    const chunk = [change.offset(-fromA + offA, -fromB + offB)];
    while (i < changes.length - 1) {
      const next = changes[i + 1];
      const [nextA, nextB] = fromLine(next.fromA + offA, next.fromB + offB, a, b);
      if (nextA > toA + 1 && nextB > toB + 1) break;
      chunk.push(next.offset(-fromA + offA, -fromB + offB));
      [toA, toB] = toLine(next.toA + offA, next.toB + offB, a, b);
      i++;
    }
    chunks.push(
      new Chunk(
        chunk,
        fromA,
        Math.max(fromA, toA),
        fromB,
        Math.max(fromB, toB),
      ),
    );
  }
  return chunks;
}

const updateMargin = 1000;

type UpdateRange = {
  fromA: number;
  toA: number;
  fromB: number;
  toB: number;
  diffA: number;
  diffB: number;
};

// Finds the given position in the chunks. Returns the extent of the
// chunk it overlaps with if it overlaps, or a position corresponding
// to that position on both sides otherwise.
function findPos(
  chunks: readonly Chunk[],
  pos: number,
  isA: boolean,
  start: boolean,
): [number, number] {
  let lo = 0;
    let hi = chunks.length;
  for (;;) {
    if (lo == hi) {
      let refA = 0;
        let refB = 0;
      if (lo) ({ toA: refA, toB: refB } = chunks[lo - 1]);
      const off = pos - (isA ? refA : refB);
      return [refA + off, refB + off];
    }
    const mid = (lo + hi) >> 1;
      const chunk = chunks[mid];
    const [from, to] = isA ? [chunk.fromA, chunk.toA] : [chunk.fromB, chunk.toB];
    if (from > pos) hi = mid;
    else if (to <= pos) lo = mid + 1;
    else return start ? [chunk.fromA, chunk.fromB] : [chunk.toA, chunk.toB];
  }
}

function findRangesForChange(
  chunks: readonly Chunk[],
  changes: ChangeDesc,
  isA: boolean,
  otherLen: number,
) {
  const ranges: UpdateRange[] = [];
  changes.iterChangedRanges((cFromA, cToA, cFromB, cToB) => {
    let fromA = 0;
      let toA = isA ? changes.length : otherLen;
    let fromB = 0;
      let toB = isA ? otherLen : changes.length;
    if (cFromA > updateMargin)
      [fromA, fromB] = findPos(chunks, cFromA - updateMargin, isA, true);
    if (cToA < changes.length - updateMargin)
      [toA, toB] = findPos(chunks, cToA + updateMargin, isA, false);
    const lenDiff = cToB - cFromB - (cToA - cFromA);
      let last;
    const [diffA, diffB] = isA ? [lenDiff, 0] : [0, lenDiff];
    if (ranges.length && (last = ranges[ranges.length - 1]).toA >= fromA)
      ranges[ranges.length - 1] = {
        fromA: last.fromA,
        fromB: last.fromB,
        toA,
        toB,
        diffA: last.diffA + diffA,
        diffB: last.diffB + diffB,
      };
    else ranges.push({ fromA, toA, fromB, toB, diffA, diffB });
  });
  return ranges;
}

function updateChunks(
  ranges: readonly UpdateRange[],
  chunks: readonly Chunk[],
  a: Text,
  b: Text,
  conf?: DiffConfig,
): readonly Chunk[] {
  if (!ranges.length) return chunks;
  const result = [];
  for (let i = 0, offA = 0, offB = 0, chunkI = 0; ; i++) {
    const range = i == ranges.length ? null : ranges[i];
    const fromA = range ? range.fromA + offA : a.length;
      const fromB = range ? range.fromB + offB : b.length;
    while (chunkI < chunks.length) {
      const next = chunks[chunkI];
      if (next.toA + offA > fromA || next.toB + offB > fromB) break;
      result.push(next.offset(offA, offB));
      chunkI++;
    }
    if (!range) break;
    const toA = range.toA + offA + range.diffA;
      const toB = range.toB + offB + range.diffB;
    const diff = presentableDiff(
      a.sliceString(fromA, toA),
      b.sliceString(fromB, toB),
      conf,
    );
    for (const chunk of toChunks(diff, a, b, fromA, fromB)) result.push(chunk);
    offA += range.diffA;
    offB += range.diffB;
    while (chunkI < chunks.length) {
      const next = chunks[chunkI];
      if (next.fromA + offA > toA && next.fromB + offB > toB) break;
      chunkI++;
    }
  }
  return result;
}

export const defaultDiffConfig = { scanLimit: 500 };
