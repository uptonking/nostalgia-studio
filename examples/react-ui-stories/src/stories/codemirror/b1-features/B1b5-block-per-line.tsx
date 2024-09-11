import * as React from 'react';
import * as View from '@codemirror/view';
import * as State from '@codemirror/state';

const maxHeightEditor = View.EditorView.theme({
  '&': {
    width: '70vw',
    maxHeight: '40vh',
  },
  '.cm-scroller': { overflow: 'auto' },
});

/**
 * Each line has a block widget attached at the bottom
 */
export function BlockWidgetPerLine() {
  const ref = React.useRef(null);

  useEditor(ref);

  return <div className='idCMEditor' ref={ref} />;
}

function useEditor(ref) {
  React.useEffect(() => {
    const view = initEditor(ref.current);
    window['edd'] = view;

    view.dispatch({
      selection: State.EditorSelection.cursor(view.state.doc.length - 1),
      scrollIntoView: true,
    });
    view.focus();

    return () => {
      view.destroy();
      window['edd'] = undefined;
    };
  }, []);
}

function initEditor(parent) {
  const lines = new Array(20).fill(1).map((_, idx) => `LINE ${idx}`);

  const cellsField = State.StateField.define({
    create() {
      let to = 0;
      return lines.map((line, idx) => {
        to += line.length + 1;
        return { to: to - 1, line: `OUTPUT ${idx}` };
      });
    },
    update(cells) {
      return cells;
    },
  });

  class CellWidget extends View.WidgetType {
    cell: any;

    constructor(cell) {
      super();
      this.cell = cell;
    }

    get estimatedHeight() {
      return 42; // 30*1.4
    }

    ignoreEvent() {
      return true;
    }

    eq() {
      return true;
    }

    toDOM() {
      const root = document.createElement('div');
      // root.style.height = this.estimatedHeight+'px'; // ❌ 加上单位每行高度会异常
      root.style.height = this.estimatedHeight as unknown as string;
      root.style.padding = '0px 2px 0px 4px';
      root.style.backgroundColor = '#888';
      root.innerHTML = this.cell.line;
      return root;
    }
  }

  const cellsWidgets = View.EditorView.decorations.compute(
    [cellsField],
    (state) => {
      const cells = state.field(cellsField);
      if (cells.length === 0) return View.Decoration.none;
      else
        return View.Decoration.set(
          cells.map((cell) => {
            const widget = new CellWidget(cell);
            const deco = View.Decoration.widget({
              widget,
              block: true,
              side: 1,
            });
            return deco.range(cell.to);
          }),
        );
    },
  );

  const state = State.EditorState.create({
    doc: State.Text.of(lines),
    extensions: [maxHeightEditor, cellsField, cellsWidgets],
  });

  const view = new View.EditorView({
    state,
    parent,
  });

  return view;
}
