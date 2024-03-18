import { isAfter } from 'date-fns';
import { z } from 'zod';
import { DateRangeField } from './date-range-field';
import {
  baseFieldQuerySchema,
  createBaseFieldSchema,
  updateBaseFieldSchema,
} from './field-base.schema';
import { FIELD_TYPE_KEY } from './field.constants';

export const dateRangeTypeSchema = z.literal('date-range');
export type DateRangeType = z.infer<typeof dateRangeTypeSchema>;
const dateRangeTypeObjectSchema = z.object({
  [FIELD_TYPE_KEY]: dateRangeTypeSchema,
});
const dateRangeObjectSchema = z.object({ format: z.string().optional() });

export const createDateRangeFieldSchema = createBaseFieldSchema
  .merge(dateRangeTypeObjectSchema)
  .merge(dateRangeObjectSchema);
export type ICreateDateRangeFieldSchema = z.infer<
  typeof createDateRangeFieldSchema
>;

export const updateDateRangeFieldSchema = updateBaseFieldSchema
  .merge(dateRangeTypeObjectSchema)
  .merge(dateRangeObjectSchema);
export type IUpdateDateRangeFieldInput = z.infer<
  typeof updateDateRangeFieldSchema
>;

export const dateRangeFieldQuerySchema = baseFieldQuerySchema
  .merge(dateRangeTypeObjectSchema)
  .merge(dateRangeObjectSchema);
export type IDateRangeFieldQuerySchema = z.infer<
  typeof dateRangeFieldQuerySchema
>;

export const dateRangeFieldValue = z
  .tuple([z.date().nullable(), z.date().nullable()])
  .nullable()
  .refine(
    (checker) => {
      if (checker) {
        const [from, to] = checker;
        if (from && to) {
          return isAfter(to, from);
        }
        return true;
      }
      return true;
    },
    { message: 'date range value from should before value to' },
  );

export type IDateRangeFieldValue = z.infer<typeof dateRangeFieldValue>;

export const dateRangeFieldQueryValue = z
  .tuple([z.string().datetime().nullable(), z.string().datetime().nullable()])
  .nullable();

export const createDateRangeFieldValue = dateRangeFieldQueryValue;
export type ICreateDateRangeFieldValue = z.infer<
  typeof createDateRangeFieldValue
>;

export type IDateRangeFieldQueryValue = z.infer<
  typeof dateRangeFieldQueryValue
>;

export const createDateRangeFieldValue_internal = z
  .object({ value: createDateRangeFieldValue })
  .merge(dateRangeTypeObjectSchema)
  .merge(z.object({ field: z.instanceof(DateRangeField) }));

export type ICreateDateRangeFieldValue_internal = z.infer<
  typeof createDateRangeFieldValue_internal
>;

export const isDateRangeField = z.instanceof(DateRangeField);
