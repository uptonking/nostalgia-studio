import type { Extension } from '@codemirror/state';

import type { InputWidgetOptions } from './types';
import { escapeListener } from './esc-listener';
import { aiPromptInput } from './prompt-input';
import {
  cmdkDiffState,
  enableUndoRedoTwiceState,
  invertCmdkDiff,
} from './cmdk-diff-state';
import { cmdkInputState, invertCmdkInput } from './cmdk-input-state';

export * from './prompt-input';
export * from './types';

/**
 * cmdk input box
 */
export function inputCardEmbedded(options: InputWidgetOptions): Extension {
  return [
    escapeListener,
    enableUndoRedoTwiceState,
    cmdkDiffState,
    invertCmdkDiff,
    cmdkInputState,
    invertCmdkInput,
    aiPromptInput(options),
  ];
}
