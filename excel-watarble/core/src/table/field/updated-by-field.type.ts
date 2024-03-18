import * as z from 'zod';
import { userIdSchema } from '../../user/value-objects/user-id.vo';
import {
  baseFieldQuerySchema,
  createBaseFieldSchema,
  updateBaseFieldSchema,
} from './field-base.schema';
import { FIELD_TYPE_KEY } from './field.constants';
import { UpdatedByField } from './updated-by-field';

export const updatedByTypeSchema = z.literal('updated-by');
export type UpdatedByFieldType = z.infer<typeof updatedByTypeSchema>;
const updatedByTypeObjectSchema = z.object({
  [FIELD_TYPE_KEY]: updatedByTypeSchema,
});
const updatedByObjectSchema = z.object({ format: z.string().optional() });

export const createUpdatedByFieldSchema = createBaseFieldSchema
  .merge(updatedByTypeObjectSchema)
  .merge(updatedByObjectSchema);

export type ICreateUpdatedByFieldInput = z.infer<
  typeof createUpdatedByFieldSchema
>;

export const updateUpdatedByFieldSchema = updateBaseFieldSchema
  .merge(updatedByTypeObjectSchema)
  .merge(updatedByObjectSchema);
export type IUpdateUpdatedByFieldInput = z.infer<
  typeof updateUpdatedByFieldSchema
>;

export const updatedByFieldQuerySchema = baseFieldQuerySchema
  .merge(updatedByTypeObjectSchema)
  .merge(updatedByObjectSchema);
export type IUpdatedByFieldQueryScheam = z.infer<
  typeof updatedByFieldQuerySchema
>;

export const updatedByFieldValue = userIdSchema;
export type IUpdatedByFieldValue = z.infer<typeof updatedByFieldValue>;

export const createUpdatedByFieldValue = updatedByFieldValue;
export type ICreateUpdatedByFieldValue = z.infer<
  typeof createUpdatedByFieldValue
>;

export const updatedByFieldQueryValue = z.string().datetime();
export type IUpdatedByFieldQueryValue = z.infer<
  typeof updatedByFieldQueryValue
>;

export const createUpdatedByFieldValue_internal = z
  .object({ value: createUpdatedByFieldValue })
  .merge(updatedByTypeObjectSchema)
  .merge(z.object({ field: z.instanceof(UpdatedByField) }));
export type ICreateUpdatedByFieldValue_internal = z.infer<
  typeof createUpdatedByFieldValue_internal
>;
