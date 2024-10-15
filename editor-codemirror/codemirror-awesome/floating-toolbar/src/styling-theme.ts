import { EditorView } from '@codemirror/view';

export const floatingToolbarTheme = EditorView.baseTheme({
  '.cm-tooltip.cm-floating-toolbar-container': {
    display: 'flex',
    height: '36px',
    border: '0',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  '.cm-tooltip .cm-floating-toolbar': {
    display: 'flex',
    gap: '4px',
    height: '36px',
    padding: '4px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    backgroundColor: '#fff',
    color: '#555',
    boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
  },
  '.cm-tooltip .cm-toolbar-item': {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    borderRadius: '6px',
    fontFamily: 'PingFang SC, Inter, sans-serif',
  },
  '.cm-tooltip .cm-toolbar-item:hover': {
    backgroundColor: '#F3F4F6',
    cursor: 'pointer',
  },
  '.cm-tooltip .action-text': {
    fontSize: '14px',
    color: '#18181B',
    fontWeight: 500,
  },
  '.cm-tooltip .action-text-secondary': {
    fontSize: '12px',
    color: '#71717A',
    fontWeight: 500,
  },
  '&dark .cm-tooltip .cm-floating-toolbar': {
    backgroundColor: '#222',
    color: '#c6c6c6',
    border: '1px solid #393939',
    boxShadow: '0px 8px 32px 0px rgba(0, 0, 0, 0.08)',
  },
});
