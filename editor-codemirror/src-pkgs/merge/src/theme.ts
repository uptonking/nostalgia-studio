import { EditorView } from '@codemirror/view';
import { StyleModule } from 'style-mod';

export const externalTheme = EditorView.styleModule.of(
  new StyleModule({
    '.cm-mergeView': {
      overflowY: 'auto',
    },
    '.cm-mergeViewEditors': {
      display: 'flex',
      alignItems: 'stretch',
    },
    '.cm-mergeViewEditor': {
      flexGrow: 1,
      flexBasis: 0,
      overflow: 'hidden',
    },
    '.cm-merge-revert': {
      width: '1.6em',
      flexGrow: 0,
      flexShrink: 0,
      position: 'relative',
    },
    '.cm-merge-revert button': {
      position: 'absolute',
      display: 'block',
      width: '100%',
      boxSizing: 'border-box',
      textAlign: 'center',
      background: 'none',
      border: 'none',
      font: 'inherit',
      cursor: 'pointer',
    },
  }),
);

export const baseTheme = EditorView.baseTheme({
  '.cm-mergeView & .cm-scroller, .cm-mergeView &': {
    height: 'auto !important',
    overflowY: 'visible !important',
  },

  '&light.cm-merge-a .cm-changedLine, .cm-deletedChunk': {
    // backgroundColor: 'rgba(160, 128, 100, .08)',
    // backgroundColor: '#ff0000',
    backgroundColor: '#ffebe9',
  },
  '&light.cm-merge-b .cm-changedLine': {
    // backgroundColor: 'rgba(100, 160, 128, .08)',
    backgroundColor: '#dafbe1',
  },
  '&light.cm-merge-b .cm-line-hidden': {
    // backgroundColor: 'rgba(100, 160, 128, .08)',
    display: 'none',
  },
  '&.cm-merge-b .cm-line-typing': {
    animation:
      'typing 0.25s steps(22), blink 0.0125s step-end infinite alternate',
    borderRight: '1.5px solid',
    width: '100%',
    // 👇 make characters on the right of the line invisible
    overflow: 'hidden',
  },
  '@keyframes typing': {
    from: { width: '0px' },
  },
  '@keyframes blink': {
    '50%': { borderColor: 'transparent' },
  },
  '&light.cm-merge-a .cm-changedText, &light .cm-deletedChunk .cm-deletedText':
    {
      background:
        'linear-gradient(#ee443366, #ee443366) bottom/100% 2px no-repeat',
    },

  '&dark.cm-merge-a .cm-changedText, &dark .cm-deletedChunk .cm-deletedText': {
    background:
      'linear-gradient(#ffaa9966, #ffaa9966) bottom/100% 2px no-repeat',
  },

  '&light.cm-merge-b .cm-changedText': {
    background:
      'linear-gradient(#22bb2266, #22bb2266) bottom/100% 2px no-repeat',
  },

  '&dark.cm-merge-b .cm-changedText': {
    background:
      'linear-gradient(#88ff8866, #88ff8866) bottom/100% 2px no-repeat',
  },

  '.cm-insertedLine, .cm-deletedLine': {
    textDecoration: 'none',
  },

  '.cm-deletedChunk': {
    paddingLeft: '6px',
    '& .cm-chunkButtons': {
      position: 'absolute',
      insetInlineEnd: '5px',
    },
    '& del': {
      textDecoration: 'none',
    },
    '& button': {
      border: 'none',
      cursor: 'pointer',
      color: 'white',
      margin: '0 2px',
      borderRadius: '3px',
      '&[name=accept]': { background: '#2a2' },
      '&[name=reject]': { background: '#d43' },
    },
  },

  '.cm-collapsedLines': {
    padding: '5px 5px 5px 10px',
    cursor: 'pointer',
  },
  '&light .cm-collapsedLines': {
    color: '#444',
    background:
      'linear-gradient(to bottom, transparent 0, #f3f3f3 30%, #f3f3f3 70%, transparent 100%)',
  },
  '&dark .cm-collapsedLines': {
    color: '#ddd',
    background:
      'linear-gradient(to bottom, transparent 0, #222 30%, #222 70%, transparent 100%)',
  },

  '.cm-changeGutter': { width: '3px', paddingLeft: '1px' },
  '&light.cm-merge-a .cm-changedLineGutter, &light .cm-deletedLineGutter': {
    background: '#e43',
  },
  '&dark.cm-merge-a .cm-changedLineGutter, &dark .cm-deletedLineGutter': {
    background: '#fa9',
  },
  '&light.cm-merge-b .cm-changedLineGutter': { background: '#2b2' },
  '&dark.cm-merge-b .cm-changedLineGutter': { background: '#8f8' },
});
