import type { Extension } from '@codemirror/state';

import type { InputWidgetOptions } from './types';
import { escapeListener } from './esc-listener';
import { aiPromptInput } from './prompt-input';

export * from './prompt-input';
export * from './types';

export function inputCardEmbedded(options: InputWidgetOptions): Extension {
  return [escapeListener, aiPromptInput(options)];
}
