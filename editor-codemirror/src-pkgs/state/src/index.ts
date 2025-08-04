export { type EditorStateConfig, EditorState } from './state';
export type { StateCommand } from './extension';
export {
  Facet,
  type FacetReader,
  StateField,
  type Extension,
  Prec,
  Compartment,
} from './facet';
export { EditorSelection, SelectionRange } from './selection';
export {
  Transaction,
  type TransactionSpec,
  Annotation,
  AnnotationType,
  StateEffect,
  StateEffectType,
} from './transaction';
export { combineConfig } from './config';
export { type ChangeSpec, ChangeSet, ChangeDesc, MapMode } from './change';
export { CharCategory } from './charcategory';
export {
  RangeValue,
  Range,
  RangeSet,
  type RangeCursor,
  RangeSetBuilder,
  type RangeComparator,
  type SpanIterator,
} from './rangeset';
export {
  findClusterBreak,
  codePointAt,
  fromCodePoint,
  codePointSize,
} from './char';
export { countColumn, findColumn } from './column';
export { Line, type TextIterator, Text } from './text';
