import type { Awareness } from 'y-protocols/awareness.js';
import type * as Y from 'yjs';

export function normQuillDelta(delta: any): any;
export class QuillBinding {
  /**
   * @param {Y.Text} type
   * @param {any} quill
   * @param {Awareness} [awareness]
   */
  constructor(type: Y.Text, quill: any, awareness?: Awareness | undefined);
  type: Y.Text;
  doc: Y.Doc;
  quill: any;
  quillCursors: any;
  _negatedUsedFormats: {};
  awareness: Awareness | undefined;
  _awarenessChange: ({
    added,
    removed,
    updated,
  }: {
    added: any;
    removed: any;
    updated: any;
  }) => void;
  /**
   * @param {Y.YTextEvent} event
   */
  _typeObserver: (event: Y.YTextEvent) => void;
  _quillObserver: (eventType: any, delta: any, state: any, origin: any) => void;
  destroy(): void;
}
