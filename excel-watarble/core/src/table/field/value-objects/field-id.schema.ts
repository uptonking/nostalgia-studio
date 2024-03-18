import * as z from 'zod';
import { FieldId } from './field-id.vo';

export const fieldIdSchema = z
  .string()
  .min(1)
  .startsWith(FieldId.FIELD_ID_PREFIX);
