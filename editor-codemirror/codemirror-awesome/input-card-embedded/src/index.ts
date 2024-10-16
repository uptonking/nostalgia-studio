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
import { cmdkTriggerRange } from './cmdk-trigger-range';

export * from './prompt-input';
export * from './types';

/**
 * cmdk input box
 */
export function inputCardEmbedded(options: InputWidgetOptions): Extension {
  return [
    escapeListener,
    enableUndoRedoTwiceState,
    cmdkInputState,
    invertCmdkInput,
    cmdkDiffState,
    invertCmdkDiff,
    aiPromptInput(options),
    cmdkTriggerRange(),
  ];
}
