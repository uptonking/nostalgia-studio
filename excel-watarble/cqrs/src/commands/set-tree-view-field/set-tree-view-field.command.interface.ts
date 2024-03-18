import { type z } from 'zod';
import { type setTreeViewFieldCommandInput } from './set-tree-view-field.command.input';

export type ISetTreeViewFieldCommandInput = z.infer<
  typeof setTreeViewFieldCommandInput
>;
