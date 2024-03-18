import { type Result } from 'oxide.ts';
import { Ok } from 'oxide.ts';

import { CompositeSpecification } from '@datalking/pivot-entity';

import { type User } from '../user';
import { type IUserSpecVisitor } from './interface';

export class WithUsername extends CompositeSpecification<
  User,
  IUserSpecVisitor
> {
  constructor(public readonly username: string) {
    super();
  }

  static fromString(name: string): WithUsername {
    return new WithUsername(name);
  }

  static fromEmail(email: string): WithUsername {
    const name = email.split('@')[0];
    return new WithUsername(name);
  }

  isSatisfiedBy(t: User): boolean {
    return this.username === t.username;
  }

  mutate(t: User): Result<User, string> {
    t.username = this.username;
    return Ok(t);
  }

  accept(v: IUserSpecVisitor): Result<void, string> {
    v.usernameEqual(this);
    return Ok(undefined);
  }
}
