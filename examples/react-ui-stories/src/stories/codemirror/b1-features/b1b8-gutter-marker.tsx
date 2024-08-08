import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { markdown } from '@codemirror/lang-markdown';
import {
  StateField,
  StateEffect,
  RangeSet,
  Compartment,
} from '@codemirror/state';
import { gutter, GutterMarker, lineNumbers } from '@codemirror/view';

const emptyMarker = new (class extends GutterMarker {
  toDOM() {
    return document.createTextNode('ø');
  }
})();

const emptyLineGutter = gutter({
  lineMarker(view, line) {
    return line.from == line.to ? emptyMarker : null;
  },
  initialSpacer: () => emptyMarker,
});

const breakpointEffect = StateEffect.define<{ pos: number; on: boolean }>({
  map: (val, mapping) => ({ pos: mapping.mapPos(val.pos), on: val.on }),
});

const breakpointState = StateField.define<RangeSet<GutterMarker>>({
  create() {
    return RangeSet.empty;
  },
  update(set, transaction) {
    set = set.map(transaction.changes);
    for (const e of transaction.effects) {
      if (e.is(breakpointEffect)) {
        if (e.value.on)
          set = set.update({ add: [breakpointMarker.range(e.value.pos)] });
        else set = set.update({ filter: (from) => from != e.value.pos });
      }
    }
    return set;
  },
});

function toggleBreakpoint(view: EditorView, pos: number) {
  const breakpoints = view.state.field(breakpointState);
  let hasBreakpoint = false;
  breakpoints.between(pos, pos, () => {
    hasBreakpoint = true;
  });
  view.dispatch({
    effects: breakpointEffect.of({ pos, on: !hasBreakpoint }),
  });
}

const breakpointMarker = new (class extends GutterMarker {
  toDOM() {
    return document.createTextNode('💔');
  }
})();

const breakpointGutter = [
  breakpointState,
  gutter({
    class: 'cm-breakpoint-gutter',
    markers: (v) => v.state.field(breakpointState),
    initialSpacer: () => breakpointMarker,
    domEventHandlers: {
      mousedown(view, line) {
        toggleBreakpoint(view, line.from);
        return true;
      },
    },
  }),
  EditorView.baseTheme({
    '.cm-breakpoint-gutter .cm-gutterElement': {
      color: 'red',
      paddingLeft: '5px',
      cursor: 'default',
    },
  }),
];

export const GutterTextNode = () => {
  const content = 'Some\ntext\nwith\n\nblank\n\nlines\n.\n';

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();
    const editor = new EditorView({
      extensions: [breakpointGutter, basicSetup, emptyLineGutter],
      doc: content,
      parent: editorRef.current,
    });
    window['edd'] = editor;

    return () => {
      editor.destroy();
      window['edd'] = undefined;
    };
  }, [content]);

  return (
    <div className='idCMEditor'>
      <div ref={editorRef} />
    </div>
  );
};
