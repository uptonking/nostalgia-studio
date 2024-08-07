export { Change, diff, presentableDiff } from './diff';
export type { DiffConfig } from './diff';

export { getChunks, goToNextChunk, goToPreviousChunk } from './merge';

export { MergeView } from './mergeview';
export type { MergeConfig, DirectMergeConfig } from './mergeview';

export {
  unifiedMergeView,
  acceptChunk,
  rejectChunk,
  getOriginalDoc,
  originalDocChangeEffect,
  updateOriginalDoc,
} from './unified';
export {
  animatableMergeView,
  // acceptChunk,
  // rejectChunk,
  // getOriginalDoc,
  // originalDocChangeEffect,
  // updateOriginalDoc,
} from './animatable-diff';

export { Chunk } from './chunk';
