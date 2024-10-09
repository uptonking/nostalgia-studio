import {
  Compartment,
  type EditorState,
  type Extension,
  Prec,
  StateEffect,
} from '@codemirror/state';
import type { CmdkDiffState } from './types';

export const showCmdkDiffView = StateEffect.define<Partial<CmdkDiffState>>();
export const hideCmdkDiffView =
  StateEffect.define<Pick<CmdkDiffState, 'showCmdkDiff'>>();

export const inputWidgetPluginCompartment = new Compartment();
export const cmdkDiffViewCompartment = new Compartment();
