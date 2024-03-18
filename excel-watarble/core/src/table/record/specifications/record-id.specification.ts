import { type Result } from 'oxide.ts';
import { Ok } from 'oxide.ts';

import { CompositeSpecification } from '@datalking/pivot-entity';

import { type Record } from '../record';
import { RecordId } from '../value-objects/index';
import { type IRecordVisitor } from './interface';

export class WithRecordId extends CompositeSpecification {
  constructor(public readonly id: RecordId) {
    super();
  }

  static fromString(id: string): WithRecordId {
    return new WithRecordId(RecordId.from(id));
  }

  isSatisfiedBy(t: Record): boolean {
    return this.id.equals(t.id);
  }

  mutate(t: Record): Result<Record, string> {
    t.id = this.id;
    return Ok(t);
  }

  accept(v: IRecordVisitor): Result<void, string> {
    v.idEqual(this);
    return Ok(undefined);
  }
}

export class WithRecordIds extends CompositeSpecification<
  Record,
  IRecordVisitor
> {
  constructor(public readonly ids: ReadonlyArray<RecordId>) {
    super();
  }

  public get idsStringList(): string[] {
    return this.ids.map((id) => id.value);
  }

  static fromIds(ids: string[]): WithRecordIds {
    return new WithRecordIds(ids.map(RecordId.from));
  }

  isSatisfiedBy(t: Record): boolean {
    return this.ids.includes(t.id);
  }

  mutate(t: Record): Result<Record, string> {
    throw new Error('Method not implemented.');
  }
  accept(v: IRecordVisitor): Result<void, string> {
    v.idsIn(this);
    return Ok(undefined);
  }
}
