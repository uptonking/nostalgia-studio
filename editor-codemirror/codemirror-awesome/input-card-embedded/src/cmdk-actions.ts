import { Compartment, StateEffect } from '@codemirror/state';
import type { CmdkDiffState, CmdkInputState } from './types';

export const showCmdkInput = StateEffect.define<Partial<CmdkInputState>>();
export const hideCmdkInput = StateEffect.define<Partial<CmdkInputState>>();
/** update input trigger range with codemirror offset; [newRange, oldRange] */
export const setInputTriggerRange =
  StateEffect.define<[[number, number], [number, number]]>();
export const setIsPromptInputFocused = StateEffect.define<boolean>();
/** update prompt text; [newText, oldText] */
export const setPromptText = StateEffect.define<[string, string]>();

export const showCmdkDiffView = StateEffect.define<Partial<CmdkDiffState>>();
export const hideCmdkDiffView = StateEffect.define<Partial<CmdkDiffState>>();
/** 1 is afterReject, 0 is beforeReject, other number does nothing; [newValue, oldValue] */
export const setIsCmdkDiffRejected = StateEffect.define<[number, number]>();
/** reset isCmdkDiffRejected to -1, so that it does nothing */
export const resetIsCmdkDiffRejected = StateEffect.define<number>();
export const setIsDocUpdatedBeforeShowDiff = StateEffect.define<boolean>();

export const enableUndoCmdkTwice = StateEffect.define<boolean>();
export const enableRedoCmdkTwice = StateEffect.define<boolean>();
export const enableUndoCmdkThrice = StateEffect.define<boolean>();
export const enableRedoCmdkThrice = StateEffect.define<boolean>();

export const inputWidgetPluginCompartment = new Compartment();
export const cmdkDiffViewCompartment = new Compartment();
