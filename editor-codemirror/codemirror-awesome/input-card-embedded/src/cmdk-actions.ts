import { Compartment, StateEffect } from '@codemirror/state';
import type { CmdkDiffState, CmdkInputState } from './types';

export const showCmdkInput = StateEffect.define<Partial<CmdkInputState>>();
export const hideCmdkInput = StateEffect.define<Partial<CmdkInputState>>();

export const showCmdkDiffView = StateEffect.define<Partial<CmdkDiffState>>();
export const hideCmdkDiffView = StateEffect.define<Partial<CmdkDiffState>>();
export const setIsDocUpdatedBeforeShowDiff = StateEffect.define<boolean>();

export const enableUndoCmdkTwice = StateEffect.define<boolean>();
export const enableRedoCmdkTwice = StateEffect.define<boolean>();

export const inputWidgetPluginCompartment = new Compartment();
export const cmdkDiffViewCompartment = new Compartment();
