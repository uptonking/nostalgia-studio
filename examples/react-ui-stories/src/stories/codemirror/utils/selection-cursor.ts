import type { EditorView } from 'codemirror';

export function checkIsCursorCollapsed(view: EditorView) {
  return view.state.selection.ranges.every((r) => r.empty);
}
globalThis['checkIsCursorCollapsed'] = checkIsCursorCollapsed;
