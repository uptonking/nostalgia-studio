import * as React from 'react';
import * as View from '@codemirror/view';
import * as State from '@codemirror/state';
import { basicSetup, EditorView } from 'codemirror';

const maxHeightEditor = EditorView.theme({
  '&': {
    width: '70vw',
    maxHeight: '40vh',
  },
  '.cm-scroller': { overflow: 'auto' },
});

const lines = new Array(20).fill(1).map((_, idx) => `LINE ${idx + 1}`);

type LineCellInfo = { to: number; line: string };

const cellsState = State.StateField.define<LineCellInfo[]>({
  create() {
    let to = 0;
    return lines.map((line, idx) => {
      to += line.length + 1;
      return { to: to - 1, line: `Widget ${idx + 1}` };
    });
  },
  /** 👇 static state */
  update(cells) {
    return cells;
  },
});

class CellWidget extends View.WidgetType {
  cell: LineCellInfo;

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
    // always not redraw
    return true;
  }

  toDOM() {
    const root = document.createElement('div');
    // root.style.height = this.estimatedHeight+'px'; // ❌ 加上单位每行高度会异常
    // root.style.height = this.estimatedHeight as unknown as string;
    root.style.padding = '0px 2px 0px 4px';
    root.style.backgroundColor = '#f1f1f1';
    root.innerHTML = this.cell.line;
    return root;
  }
}

const cellsWidgets = EditorView.decorations.compute([cellsState], (state) => {
  const cells = state.field(cellsState);
  if (cells.length === 0) return View.Decoration.none;
  else
    return View.Decoration.set(
      cells.map((cell) => {
        const widget = new CellWidget(cell);
        // 👇 block widget
        const deco = View.Decoration.widget({
          widget,
          block: true,
          // if positive, the widget will be drawn after the cursor
          // side: -1,
          side: 1,
        });
        return deco.range(cell.to);
      }),
    );
});

/**
 * Each line has a block widget attached at the bottom/top
 * - decorations(stateField) are static block widget
 * - Decoration.widget
 */
export function BlockWidgetPerLine() {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const view = initEditor(ref.current);
    window['edd'] = view;

    view.dispatch({
      // selection: State.EditorSelection.cursor(view.state.doc.length - 1),
      selection: State.EditorSelection.cursor(view.state.doc.length),
      scrollIntoView: true,
    });
    view.focus();

    return () => {
      view.destroy();
      window['edd'] = undefined;
    };
  }, []);

  return <div className='idCMEditor' ref={ref} />;
}

function initEditor(parent) {
  const state = State.EditorState.create({
    doc: State.Text.of(lines),
    extensions: [basicSetup, maxHeightEditor, cellsState, cellsWidgets],
  });

  const view = new EditorView({
    state,
    parent,
  });

  return view;
}
