import { type Result } from 'oxide.ts';
import { Err, Ok } from 'oxide.ts';
import * as z from 'zod';

import { NanoID } from '@datalking/pivot-entity';

import { InvalidTableIdError } from '../table.errors';

export const tableIdSchema = z.string().min(1);

export class TableId extends NanoID {
  private static TABLE_ID_PREFIX = 'tbl';
  private static TABLE_ID_SIZE = 8;

  static create(): TableId {
    const id = NanoID.createId(TableId.TABLE_ID_PREFIX, TableId.TABLE_ID_SIZE);
    return new TableId(id);
  }

  static from(id: string): Result<TableId, InvalidTableIdError> {
    if (!id) {
      return Err(new InvalidTableIdError());
    }
    return Ok(new TableId(id));
  }

  static fromOrCreate(id?: string): TableId {
    if (!id) {
      return TableId.create();
    }
    return TableId.from(id).unwrap();
  }
}
