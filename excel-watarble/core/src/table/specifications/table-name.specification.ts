import { Ok, type Result } from 'oxide.ts';

import { CompositeSpecification } from '@datalking/pivot-entity';

import { type Table } from '../table';
import { TableName } from '../value-objects/index';
import { type ITableSpecVisitor } from './interface';

export class WithTableName extends CompositeSpecification {
  constructor(public readonly name: TableName) {
    super();
  }

  static fromString(name: string): WithTableName {
    return new WithTableName(TableName.create(name));
  }

  static unsafe(name: string): WithTableName {
    return new WithTableName(TableName.unsafeCreate(name));
  }

  isSatisfiedBy(t: Table): boolean {
    return this.name.equals(t.name);
  }

  mutate(t: Table): Result<Table, string> {
    t.name = this.name;
    return Ok(t);
  }

  accept(v: ITableSpecVisitor): Result<void, string> {
    v.nameEqual(this);
    return Ok(undefined);
  }
}
