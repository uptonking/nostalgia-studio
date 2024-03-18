import type * as z from 'zod';

import { type createOptionCommandInput } from './create-option.command.input';

export type ICreateOptionCommandInput = z.infer<
  typeof createOptionCommandInput
>;
