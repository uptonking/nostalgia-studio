import type { Extension } from '@codemirror/state';
import type { EditorView } from './editorview';
import { ViewPlugin, type ViewUpdate } from './extension';
import { Decoration, type DecorationSet } from './decoration';

/// Mark lines that have a cursor on them with the `"cm-activeLine"`
/// DOM class.
export function highlightActiveLine(): Extension {
  return activeLineHighlighter;
}

const lineDeco = Decoration.line({ class: 'cm-activeLine' });

const activeLineHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.getDeco(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet)
        this.decorations = this.getDeco(update.view);
    }

    getDeco(view: EditorView) {
      let lastLineStart = -1;
      const deco = [];
      for (const r of view.state.selection.ranges) {
        const line = view.lineBlockAt(r.head);
        if (line.from > lastLineStart) {
          deco.push(lineDeco.range(line.from));
          lastLineStart = line.from;
        }
      }
      return Decoration.set(deco);
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);
