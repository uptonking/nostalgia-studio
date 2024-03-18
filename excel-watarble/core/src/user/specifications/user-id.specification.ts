import { type Result } from 'oxide.ts';
import { Ok } from 'oxide.ts';

import { CompositeSpecification } from '@datalking/pivot-entity';

import { type User } from '../user';
import { UserId } from '../value-objects/user-id.vo';
import { type IUserSpecVisitor } from './interface';

export class WithUserId extends CompositeSpecification<User, IUserSpecVisitor> {
  constructor(public readonly userId: UserId) {
    super();
  }

  static fromString(id: string): WithUserId {
    return new WithUserId(UserId.from(id).unwrap());
  }

  static create(): WithUserId {
    return new WithUserId(UserId.create());
  }

  isSatisfiedBy(t: User): boolean {
    return this.userId === t.userId;
  }

  mutate(t: User): Result<User, string> {
    t.userId = this.userId;
    return Ok(t);
  }

  accept(v: IUserSpecVisitor): Result<void, string> {
    v.idEqual(this);
    return Ok(undefined);
  }
}
