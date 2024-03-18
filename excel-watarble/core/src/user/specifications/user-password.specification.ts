import { type Result } from 'oxide.ts';
import { Ok } from 'oxide.ts';

import { CompositeSpecification } from '@datalking/pivot-entity';

import { type User } from '../user';
import { type IUserSpecVisitor } from './interface';

export class WithUserPassword extends CompositeSpecification<
  User,
  IUserSpecVisitor
> {
  constructor(public readonly userPassword: string) {
    super();
  }

  static fromString(password: string): WithUserPassword {
    return new WithUserPassword(password);
  }

  isSatisfiedBy(t: User): boolean {
    return false;
  }

  mutate(t: User): Result<User, string> {
    t.password = this.userPassword;
    return Ok(t);
  }

  accept(v: IUserSpecVisitor): Result<void, string> {
    throw new Error('not implemented');
  }
}
