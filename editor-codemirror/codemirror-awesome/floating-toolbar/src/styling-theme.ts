import { EditorView } from '@codemirror/view';

export const cursorTooltipBaseTheme = EditorView.baseTheme({
  '.cm-tooltip.cm-ai-tooltip-cursor': {
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '8px',
    padding: '16px',
    '& code': {
      borderRadius: '4px',
      padding: '4px 6px',
      '& b': {
        fontWeight: 'bold'
      }
    }
  },
  '&light .cm-tooltip.cm-ai-tooltip-cursor': {
    backgroundColor: '#fff',
    color: '#555',
    border: '1px solid #EDEDED',
    boxShadow: '0px 8px 32px 0px rgba(0, 0, 0, 0.08)'
  },
  '&light .cm-tooltip.cm-ai-tooltip-cursor code': {
    border: '1px solid #E6E6E6',
    backgroundColor: '#F9F9F9'
  },
  '&dark .cm-tooltip.cm-ai-tooltip-cursor': {
    backgroundColor: '#222',
    color: '#c6c6c6',
    border: '1px solid #393939',
    boxShadow: '0px 8px 32px 0px rgba(0, 0, 0, 0.08)'
  },
  '&dark .cm-tooltip.cm-ai-tooltip-cursor code': {
    border: '1px solid #333',
    backgroundColor: '#1a1a1a'
  }
})
