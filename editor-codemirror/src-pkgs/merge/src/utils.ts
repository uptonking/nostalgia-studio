import type { EditorState } from '@codemirror/state';
import { animatableDiffViewCompartment } from './diff-actions';

export function isAnimatableDiffViewActive(state: EditorState) {
  const diffViewExt = animatableDiffViewCompartment.get(state);
  if (Array.isArray(diffViewExt)) {
    return diffViewExt.length > 0;
  }
  return false;
}
