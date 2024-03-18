import { type Result } from 'oxide.ts';
import { Err, Ok } from 'oxide.ts';
import { z } from 'zod';

import { NanoID } from '@datalking/pivot-entity';

import { InvalidUserIdError } from '../user.errors';

export class UserId extends NanoID {
  public static USER_ID_PREFIX = 'usr';
  private static USER_ID_SIZE = 8;

  static create(): UserId {
    const id = NanoID.createId(UserId.USER_ID_PREFIX, UserId.USER_ID_SIZE);
    return new UserId(id);
  }

  static from(id: string): Result<UserId, InvalidUserIdError> {
    if (!id) {
      return Err(new InvalidUserIdError());
    }
    return Ok(new UserId(id));
  }

  static fromOrCreate(id?: string): UserId {
    if (!id) {
      return UserId.create();
    }
    return UserId.from(id).unwrap();
  }
}

export const userIdSchema = z.string().startsWith(UserId.USER_ID_PREFIX);
