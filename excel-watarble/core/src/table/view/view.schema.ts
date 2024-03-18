import { z } from 'zod';

import { rootFilter } from '../field/filter/filter';
import { fieldIdSchema } from '../field/value-objects/field-id.schema';
import { fieldNameSchema } from '../field/value-objects/field-name.schema';
import { calendarSchema } from './calendar/index';
import { kanbanSchema } from './kanban/index';
import { sortsSchema } from './sort/sort.schema';
import { treeViewSchema } from './tree-view/index';
import {
  fieldHiddenSchema,
  fieldWidthSchema,
  viewFieldOption,
} from './view-field-options';
import { viewIdSchema } from './view-id.vo';
import { viewNameSchema } from './view-name.vo';
import { viewPinnedFields } from './view-pinned-fields';

export const viewDisplayType = z.enum(['grid', 'kanban', 'calendar', 'tree']);

export const createViewSchema = z.object({
  id: viewIdSchema.optional(),
  name: viewNameSchema,
  displayType: viewDisplayType.optional(),
});

export type ICreateViewSchema = z.infer<typeof createViewSchema>;

export const updateViewNameSchema = z.object({
  id: viewIdSchema,
  name: viewNameSchema,
});

export type IUpdateViewNameSchema = z.infer<typeof updateViewNameSchema>;

export const createViewInput_internal = z.object({
  id: viewIdSchema.optional(),
  name: viewNameSchema,
  showSystemFields: z.boolean().optional(),
  sorts: sortsSchema.optional(),
  kanban: kanbanSchema.optional(),
  calendar: calendarSchema.optional(),
  tree: treeViewSchema.optional(),
  displayType: viewDisplayType.optional(),
  filter: rootFilter.optional(),
  fieldOptions: z.record(viewFieldOption).optional(),
  fieldsOrder: z.string().array().optional(),
  pinnedFields: viewPinnedFields.optional(),
});

export const queryView = z.object({
  id: viewIdSchema,
  name: z.string(),
  showSystemFields: z.boolean().optional(),
  sorts: sortsSchema.optional(),
  kanban: kanbanSchema.optional(),
  calendar: calendarSchema.optional(),
  tree: treeViewSchema.optional(),
  displayType: viewDisplayType,
  filter: rootFilter.optional(),
  fieldOptions: z.record(viewFieldOption).optional(),
  fieldsOrder: z.string().array().optional(),
  pinnedFields: viewPinnedFields.optional(),
});

export const queryViews = z.array(queryView).optional();

const viewFieldOptionBaseSchema = z.object({
  viewId: viewIdSchema.optional(),
  fieldId: fieldNameSchema,
});

export const setFieldWidthSchema = z
  .object({
    width: fieldWidthSchema,
  })
  .merge(viewFieldOptionBaseSchema);
export type ISetFieldWidthSchema = z.infer<typeof setFieldWidthSchema>;

export const setFieldVisibilitySchema = z
  .object({
    hidden: fieldHiddenSchema.unwrap(),
  })
  .merge(viewFieldOptionBaseSchema);

export type ISetFieldVisibilitySchema = z.infer<
  typeof setFieldVisibilitySchema
>;

export const moveFieldSchema = z.object({
  viewId: viewIdSchema.optional(),
  from: fieldIdSchema,
  to: fieldIdSchema,
});

export type IMoveFieldSchema = z.infer<typeof moveFieldSchema>;

export const switchDisplayTypeSchema = z.object({
  viewId: viewIdSchema.optional(),
  displayType: viewDisplayType,
});

export type ISwitchDisplayTypeSchema = z.infer<typeof switchDisplayTypeSchema>;

export const setKanbanFieldSchema = z.object({
  viewId: viewIdSchema.optional(),
  field: fieldIdSchema,
});
export type ISetKanbanFieldSchema = z.infer<typeof setKanbanFieldSchema>;

export const setCalendarFieldSchema = z.object({
  viewId: viewIdSchema.optional(),
  field: fieldIdSchema,
});
export type ISetCalendarFieldSchema = z.infer<typeof setCalendarFieldSchema>;

export const setTreeViewFieldSchema = z.object({
  viewId: viewIdSchema.optional(),
  field: fieldIdSchema,
});
export type ISetTreeViewFieldSchema = z.infer<typeof setTreeViewFieldSchema>;

export const moveViewSchema = z.object({
  from: viewIdSchema,
  to: viewIdSchema,
});

export type IMoveViewSchema = z.infer<typeof moveViewSchema>;

export const setPinnedFieldsSchema = z.object({
  viewId: viewIdSchema.optional(),
  pinnedFields: viewPinnedFields,
});

export type ISetPinnedFieldsSchema = z.infer<typeof setPinnedFieldsSchema>;
