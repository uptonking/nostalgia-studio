import { type Result } from 'oxide.ts';
import { Ok } from 'oxide.ts';

import { CompositeSpecification, DateVO } from '@datalking/pivot-entity';

import { type Record } from '../record';
import { type IRecordVisitor } from './interface';

export class WithRecordUpdatedAt extends CompositeSpecification<
  Record,
  IRecordVisitor
> {
  constructor(public readonly date: DateVO) {
    super();
  }

  static fromDate(date: Date): WithRecordUpdatedAt {
    return new this(new DateVO(date));
  }

  static fromString(date: string): WithRecordUpdatedAt {
    return this.fromDate(new Date(date));
  }

  isSatisfiedBy(t: Record): boolean {
    return this.date.equals(t.createdAt);
  }

  mutate(r: Record): Result<Record, string> {
    r.updatedAt = this.date;
    return Ok(r);
  }

  accept(v: IRecordVisitor): Result<void, string> {
    v.createdAt(this);
    return Ok(undefined);
  }
}
