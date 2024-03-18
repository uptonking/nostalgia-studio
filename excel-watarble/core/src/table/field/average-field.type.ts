import * as z from 'zod';
import { AverageField } from './average-field';
import {
  baseFieldQuerySchema,
  createBaseFieldSchema,
  updateBaseFieldSchema,
} from './field-base.schema';
import { FIELD_TYPE_KEY } from './field.constants';
import { fieldIdSchema } from './value-objects/field-id.schema';

export const averageTypeSchema = z.literal('average');
export type AverageType = z.infer<typeof averageTypeSchema>;
const averageTypeObjectSchema = z.object({
  [FIELD_TYPE_KEY]: averageTypeSchema,
});

export const createAverageFieldSchema = createBaseFieldSchema
  .merge(averageTypeObjectSchema)
  .merge(
    z.object({
      referenceFieldId: fieldIdSchema,
      aggregateFieldId: fieldIdSchema,
    }),
  )
  .strict();
export type ICreateAverageFieldInput = z.infer<typeof createAverageFieldSchema>;

export const updateAverageFieldSchema = updateBaseFieldSchema
  .merge(averageTypeObjectSchema)
  .merge(
    z
      .object({
        referenceFieldId: fieldIdSchema,
        aggregateFieldId: fieldIdSchema,
      })
      .partial(),
  );
export type IUpdateAverageFieldInput = z.infer<typeof updateAverageFieldSchema>;

export const averageFieldQuerySchema = baseFieldQuerySchema
  .merge(averageTypeObjectSchema)
  .merge(
    z
      .object({
        referenceFieldId: fieldIdSchema,
        aggregateFieldId: fieldIdSchema,
      })
      .partial(),
  );
export type IAverageFieldQuerySchema = z.infer<typeof averageFieldQuerySchema>;

export const averageFieldValue = z.number().nullable();
export type IAverageFieldValue = z.infer<typeof averageFieldValue>;

export const createAverageFieldValue = averageFieldValue;
export type ICreateAverageFieldValue = z.infer<typeof createAverageFieldValue>;

export const averageFieldQueryValue = averageFieldValue;
export type IAverageFieldQueryValue = z.infer<typeof averageFieldQueryValue>;

export const createAverageFieldValue_internal = z
  .object({ value: createAverageFieldValue })
  .merge(averageTypeObjectSchema)
  .merge(z.object({ field: z.instanceof(AverageField) }));
export type ICreateAverageFieldValue_internal = z.infer<
  typeof createAverageFieldValue_internal
>;
