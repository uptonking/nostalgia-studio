import { type Result } from 'oxide.ts';
import { Ok } from 'oxide.ts';

import { CompositeSpecification } from '@datalking/pivot-entity';

import { type ICollaboratorProfile } from '../../field/collaborator-field.type';
import { type Record } from '../record';
import { type IRecordVisitor } from './interface';

export class WithRecordCreatedBy extends CompositeSpecification<
  Record,
  IRecordVisitor
> {
  constructor(public readonly user: string) {
    super();
  }

  static fromString(user: string): WithRecordCreatedBy {
    return new this(user);
  }

  isSatisfiedBy(t: Record): boolean {
    return this.user === t.createdBy;
  }

  mutate(r: Record): Result<Record, string> {
    r.createdBy = this.user;
    return Ok(r);
  }

  accept(v: IRecordVisitor): Result<void, string> {
    v.createdBy(this);
    return Ok(undefined);
  }
}

export class WithRecordCreatedByProfile extends CompositeSpecification<
  Record,
  IRecordVisitor
> {
  constructor(public readonly profile: ICollaboratorProfile | null) {
    super();
  }

  isSatisfiedBy(t: Record): boolean {
    throw new Error('not implemented');
  }

  mutate(r: Record): Result<Record, string> {
    r.createdByProfile = this.profile;
    return Ok(r);
  }

  accept(v: IRecordVisitor): Result<void, string> {
    return Ok(undefined);
  }
}
