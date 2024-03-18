import * as z from 'zod';
import { recordIdSchema } from '../record/value-objects/record-id.schema';
import {
  baseFieldQuerySchema,
  createBaseFieldSchema,
  updateBaseFieldSchema,
} from './field-base.schema';
import { FIELD_TYPE_KEY } from './field.constants';
import { TreeField } from './tree-field';
import { fieldIdSchema } from './value-objects/field-id.schema';
import { fieldNameSchema } from './value-objects/field-name.schema';

export const treeTypeSchema = z.literal('tree');
export type TreeFieldType = z.infer<typeof treeTypeSchema>;
const treeTypeObjectSchema = z.object({ [FIELD_TYPE_KEY]: treeTypeSchema });

export const createTreeFieldSchema = createBaseFieldSchema
  .merge(treeTypeObjectSchema)
  .merge(
    z.object({
      parentFieldId: fieldIdSchema.optional(),
      parentFieldName: fieldNameSchema.optional(),
      displayFieldIds: fieldIdSchema.array().optional(),
    }),
  );
export type ICreateTreeFieldSchema = z.infer<typeof createTreeFieldSchema>;

export const updateTreeFieldSchema = updateBaseFieldSchema
  .merge(treeTypeObjectSchema)
  .merge(
    z.object({
      displayFieldIds: fieldIdSchema.array().optional(),
    }),
  );
export type IUpdateTreeFieldInput = z.infer<typeof updateTreeFieldSchema>;

export const treeFieldQuerySchema = baseFieldQuerySchema
  .merge(treeTypeObjectSchema)
  .merge(
    z.object({
      parentFieldId: fieldIdSchema,
      displayFieldIds: fieldIdSchema.array().optional(),
    }),
  );
export type ITreeFieldQuerySchema = z.infer<typeof treeFieldQuerySchema>;

export const treeFieldValue = recordIdSchema.array().nullable();
export type ITreeFieldValue = z.infer<typeof treeFieldValue>;

export const treeFieldQueryValue = treeFieldValue;
export type ITreeFieldQueryValue = z.infer<typeof treeFieldQueryValue>;

export const createTreeFieldValue = treeFieldValue;
export type ICreateTreeFieldValue = z.infer<typeof createTreeFieldValue>;

export const createTreeFieldValue_internal = z
  .object({ value: createTreeFieldValue })
  .merge(treeTypeObjectSchema)
  .merge(z.object({ field: z.instanceof(TreeField) }));
export type ICreateTreeFieldValue_internal = z.infer<
  typeof createTreeFieldValue_internal
>;
