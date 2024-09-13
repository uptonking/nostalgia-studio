import { Decoration, type EditorView, ViewPlugin } from '@codemirror/view';

/**
 * `ESC` hotkey is not registered by `keymap.of([])` to avoid messing with tab/focus
 */
export const escapeListener = ViewPlugin.fromClass(
  class {
    constructor(public view: EditorView) {
      document.addEventListener('keydown', this.escapeListener);
    }

    escapeListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // dismiss tooltip
        // hideTooltip(this.view)

        // dismiss prompt input widget
        document.dispatchEvent(
          new CustomEvent('dismiss_ai_widget', {
            detail: { source: 'esc_key' },
          }),
        );
      }
    };

    update() {}

    destroy() {
      document.removeEventListener('keydown', this.escapeListener);
    }
  },
  {
    decorations: () => Decoration.none,
  },
);
