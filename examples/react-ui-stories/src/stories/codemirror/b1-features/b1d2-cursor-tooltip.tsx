import React, { useEffect, useRef } from 'react';

import { basicSetup, EditorView } from 'codemirror';

import { type EditorState, Compartment, StateField } from '@codemirror/state';
import { hoverTooltip, type Tooltip, showTooltip } from '@codemirror/view';

const cursorTooltipBaseTheme = EditorView.baseTheme({
  '.cm-tooltip.cm-tooltip-cursor': {
    backgroundColor: '#66b',
    color: 'white',
    border: 'none',
    padding: '2px 7px',
    borderRadius: '4px',
    '& .cm-tooltip-arrow:before': {
      borderTopColor: '#66b',
    },
    '& .cm-tooltip-arrow:after': {
      borderTopColor: 'transparent',
    },
  },
});

export const wordHover = hoverTooltip((view, pos, side) => {
  const { from, to, text } = view.state.doc.lineAt(pos);
  let start = pos;
  let end = pos;
  while (start > from && /\w/.test(text[start - from - 1])) start--;
  while (end < to && /\w/.test(text[end - from])) end++;
  if ((start == pos && side < 0) || (end == pos && side > 0)) return null;
  return {
    pos: start,
    end,
    above: true,
    create(view) {
      const dom = document.createElement('div');
      dom.textContent = text.slice(start - from, end - from);
      return { dom };
    },
  };
});

const cursorTooltipState = StateField.define<readonly Tooltip[]>({
  create: getCursorTooltips,

  update(tooltips, tr) {
    if (!tr.docChanged && !tr.selection) return tooltips;
    return getCursorTooltips(tr.state);
  },

  provide: (f) => showTooltip.computeN([f], (state) => state.field(f)),
});

function getCursorTooltips(state: EditorState): readonly Tooltip[] {
  return state.selection.ranges
    .filter((range) => range.empty)
    .map((range) => {
      const line = state.doc.lineAt(range.head);
      const text = line.number + ':' + (range.head - line.from);
      return {
        pos: range.head,
        above: true,
        strictSide: true,
        arrow: true,
        create: () => {
          const dom = document.createElement('div');
          dom.className = 'cm-tooltip-cursor';
          dom.textContent = text;
          return { dom };
        },
      };
    });
}

export const CursorTooltip = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const hoverEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const language = new Compartment();

    const editor = new EditorView({
      doc: 'Move through this text to\nsee your tooltip\n',
      extensions: [basicSetup, cursorTooltipState, cursorTooltipBaseTheme],
      parent: editorRef.current,
    });

    const hoverEditor = new EditorView({
      doc: 'Hover over words to get tooltips\n',
      extensions: [basicSetup, wordHover],
      parent: hoverEditorRef.current,
    });
    window['edd'] = hoverEditor;

    return () => {
      hoverEditor.destroy();
      window['edd'] = undefined;
    };
  }, []);

  return (
    <div className='idCMEditor'>
      <h2>cursor tooltip</h2>
      <div ref={editorRef} />
      <h2>hover tooltip</h2>
      <div ref={hoverEditorRef} />
    </div>
  );
};
