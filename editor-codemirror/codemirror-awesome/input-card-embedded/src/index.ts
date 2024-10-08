import type { Extension } from '@codemirror/state';

import type { InputWidgetOptions } from './types';
import { escapeListener } from './esc-listener';
import { aiPromptInput } from './prompt-input';
import { cmdkDiffState, invertCmdkDiff } from './cmdk-diff-state';

export * from './prompt-input';
export * from './types';

/**
 * cmdk input box
 */
export function inputCardEmbedded(options: InputWidgetOptions): Extension {
  return [
    escapeListener,
    cmdkDiffState,
    invertCmdkDiff,
    aiPromptInput(options),
  ];
}
