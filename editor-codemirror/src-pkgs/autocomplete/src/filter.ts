import { codePointAt, codePointSize, fromCodePoint } from '@codemirror/state';

// Scores are counted from 0 (great match) down to negative numbers,
// assigning specific penalty values for specific shortcomings.
const enum Penalty {
  Gap = -1100, // Added for each gap in the match (not counted for by-word matches)
  NotStart = -700, // The match doesn't start at the start of the word
  CaseFold = -200, // At least one character needed to be case-folded to match
  ByWord = -100, // The match is by-word, meaning each char in the pattern matches the start of a word in the string
  NotFull = -100, // Used to push down matches that don't match the pattern fully relative to those that do
}

const enum Tp {
  NonWord,
  Upper,
  Lower,
}

// A pattern matcher for fuzzy completion matching. Create an instance
// once for a pattern, and then use that to match any number of
// completions.
export class FuzzyMatcher {
  chars: number[] = [];
  folded: number[] = [];
  astral: boolean;

  // Buffers reused by calls to `match` to track matched character
  // positions.
  any: number[] = [];
  precise: number[] = [];
  byWord: number[] = [];

  score = 0;
  matched: readonly number[] = [];

  constructor(readonly pattern: string) {
    for (let p = 0; p < pattern.length; ) {
      const char = codePointAt(pattern, p);
      const size = codePointSize(char);
      this.chars.push(char);
      const part = pattern.slice(p, p + size);
      const upper = part.toUpperCase();
      this.folded.push(
        codePointAt(upper == part ? part.toLowerCase() : upper, 0),
      );
      p += size;
    }
    this.astral = pattern.length != this.chars.length;
  }

  ret(score: number, matched: readonly number[]) {
    this.score = score;
    this.matched = matched;
    return this;
  }

  // Matches a given word (completion) against the pattern (input).
  // Will return a boolean indicating whether there was a match and,
  // on success, set `this.score` to the score, `this.matched` to an
  // array of `from, to` pairs indicating the matched parts of `word`.
  //
  // The score is a number that is more negative the worse the match
  // is. See `Penalty` above.
  match(word: string): { score: number; matched: readonly number[] } | null {
    if (this.pattern.length == 0) return this.ret(Penalty.NotFull, []);
    if (word.length < this.pattern.length) return null;
    const { chars, folded, any, precise, byWord } = this;
    // For single-character queries, only match when they occur right
    // at the start
    if (chars.length == 1) {
      const first = codePointAt(word, 0);
      const firstSize = codePointSize(first);
      let score = firstSize == word.length ? 0 : Penalty.NotFull;
      if (first == chars[0]) {
      } else if (first == folded[0]) score += Penalty.CaseFold;
      else return null;
      return this.ret(score, [0, firstSize]);
    }
    const direct = word.indexOf(this.pattern);
    if (direct == 0)
      return this.ret(
        word.length == this.pattern.length ? 0 : Penalty.NotFull,
        [0, this.pattern.length],
      );

    const len = chars.length;
    let anyTo = 0;
    if (direct < 0) {
      for (let i = 0, e = Math.min(word.length, 200); i < e && anyTo < len; ) {
        const next = codePointAt(word, i);
        if (next == chars[anyTo] || next == folded[anyTo]) any[anyTo++] = i;
        i += codePointSize(next);
      }
      // No match, exit immediately
      if (anyTo < len) return null;
    }

    // This tracks the extent of the precise (non-folded, not
    // necessarily adjacent) match
    let preciseTo = 0;
    // Tracks whether there is a match that hits only characters that
    // appear to be starting words. `byWordFolded` is set to true when
    // a case folded character is encountered in such a match
    let byWordTo = 0;
    let byWordFolded = false;
    // If we've found a partial adjacent match, these track its state
    let adjacentTo = 0;
    let adjacentStart = -1;
    let adjacentEnd = -1;
    const hasLower = /[a-z]/.test(word);
    let wordAdjacent = true;
    // Go over the option's text, scanning for the various kinds of matches
    for (
      let i = 0, e = Math.min(word.length, 200), prevType = Tp.NonWord;
      i < e && byWordTo < len;

    ) {
      const next = codePointAt(word, i);
      if (direct < 0) {
        if (preciseTo < len && next == chars[preciseTo])
          precise[preciseTo++] = i;
        if (adjacentTo < len) {
          if (next == chars[adjacentTo] || next == folded[adjacentTo]) {
            if (adjacentTo == 0) adjacentStart = i;
            adjacentEnd = i + 1;
            adjacentTo++;
          } else {
            adjacentTo = 0;
          }
        }
      }
      let ch;
      const type =
        next < 0xff
          ? (next >= 48 && next <= 57) || (next >= 97 && next <= 122)
            ? Tp.Lower
            : next >= 65 && next <= 90
              ? Tp.Upper
              : Tp.NonWord
          : (ch = fromCodePoint(next)) != ch.toLowerCase()
            ? Tp.Upper
            : ch != ch.toUpperCase()
              ? Tp.Lower
              : Tp.NonWord;
      if (
        !i ||
        (type == Tp.Upper && hasLower) ||
        (prevType == Tp.NonWord && type != Tp.NonWord)
      ) {
        if (
          chars[byWordTo] == next ||
          (folded[byWordTo] == next && (byWordFolded = true))
        )
          byWord[byWordTo++] = i;
        else if (byWord.length) wordAdjacent = false;
      }
      prevType = type;
      i += codePointSize(next);
    }

    if (byWordTo == len && byWord[0] == 0 && wordAdjacent)
      return this.result(
        Penalty.ByWord + (byWordFolded ? Penalty.CaseFold : 0),
        byWord,
        word,
      );
    if (adjacentTo == len && adjacentStart == 0)
      return this.ret(
        Penalty.CaseFold -
          word.length +
          (adjacentEnd == word.length ? 0 : Penalty.NotFull),
        [0, adjacentEnd],
      );
    if (direct > -1)
      return this.ret(Penalty.NotStart - word.length, [
        direct,
        direct + this.pattern.length,
      ]);
    if (adjacentTo == len)
      return this.ret(Penalty.CaseFold + Penalty.NotStart - word.length, [
        adjacentStart,
        adjacentEnd,
      ]);
    if (byWordTo == len)
      return this.result(
        Penalty.ByWord +
          (byWordFolded ? Penalty.CaseFold : 0) +
          Penalty.NotStart +
          (wordAdjacent ? 0 : Penalty.Gap),
        byWord,
        word,
      );
    return chars.length == 2
      ? null
      : this.result(
          (any[0] ? Penalty.NotStart : 0) + Penalty.CaseFold + Penalty.Gap,
          any,
          word,
        );
  }

  result(score: number, positions: number[], word: string) {
    const result: number[] = [];
    let i = 0;
    for (const pos of positions) {
      const to =
        pos + (this.astral ? codePointSize(codePointAt(word, pos)) : 1);
      if (i && result[i - 1] == pos) result[i - 1] = to;
      else {
        result[i++] = pos;
        result[i++] = to;
      }
    }
    return this.ret(score - word.length, result);
  }
}

export class StrictMatcher {
  matched: readonly number[] = [];
  score: number = 0;
  folded: string;

  constructor(readonly pattern: string) {
    this.folded = pattern.toLowerCase();
  }

  match(word: string): { score: number; matched: readonly number[] } | null {
    if (word.length < this.pattern.length) return null;
    const start = word.slice(0, this.pattern.length);
    const match =
      start == this.pattern
        ? 0
        : start.toLowerCase() == this.folded
          ? Penalty.CaseFold
          : null;
    if (match == null) return null;
    this.matched = [0, start.length];
    this.score =
      match + (word.length == this.pattern.length ? 0 : Penalty.NotFull);
    return this;
  }
}