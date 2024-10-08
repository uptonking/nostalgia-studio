import {
  Compartment,
  type EditorState,
  type Extension,
  Prec,
  StateEffect,
} from '@codemirror/state';
import type { CmdkDiffState } from './types';

export const showCmdkDiffView = StateEffect.define<CmdkDiffState>();
export const hideCmdkDiffView = StateEffect.define<CmdkDiffState>();


export const inputWidgetPluginCompartment = new Compartment();
export const animeDiffViewCompartment = new Compartment();
