import { type Result } from 'oxide.ts';

import { and } from '@datalking/pivot-entity';

import { type TableSchemaIdMap } from '../value-objects/index';
import { Record } from './record';
import { type IQueryRecordSchema, type Records } from './record.type';
import {
  WithDisplayValues,
  WithRecordCreatedAt,
  WithRecordCreatedBy,
  WithRecordCreatedByProfile,
  WithRecordId,
  WithRecordTableId,
  WithRecordUpdatedAt,
  WithRecordValues,
} from './specifications/index';
import { type RecordCompositeSpecification } from './specifications/interface';
import { WithRecordAutoIncrement } from './specifications/record-auto-increment.specification';
import {
  WithRecordUpdatedBy,
  WithRecordUpdatedByProfile,
} from './specifications/record-updated-by.specification';

export class RecordFactory {
  static create(
    ...specs: RecordCompositeSpecification[]
  ): Result<Record, string>;
  static create(spec: RecordCompositeSpecification): Result<Record, string>;

  static create(
    spec: RecordCompositeSpecification | RecordCompositeSpecification[],
  ): Result<Record, string> {
    if (Array.isArray(spec)) {
      return and(...spec)
        .unwrap()
        .mutate(Record.empty());
    }
    return spec.mutate(Record.empty());
  }

  static fromQueryRecords(
    rs: IQueryRecordSchema[],
    schema: TableSchemaIdMap,
  ): Records {
    return rs.map((r) => this.fromQuery(r, schema).unwrap());
  }

  static fromQuery(
    r: IQueryRecordSchema,
    schema: TableSchemaIdMap,
  ): Result<Record, string> {
    let spec = WithRecordId.fromString(r.id)
      .and(WithRecordTableId.fromString(r.tableId).unwrap())
      .and(WithRecordCreatedAt.fromString(r.createdAt))
      .and(WithRecordCreatedBy.fromString(r.createdBy))
      .and(new WithRecordCreatedByProfile(r.createdByProfile))
      .and(WithRecordUpdatedAt.fromString(r.updatedAt))
      .and(WithRecordUpdatedBy.fromString(r.updatedBy))
      .and(new WithRecordUpdatedByProfile(r.updatedByProfile))
      .and(WithRecordValues.fromObject(schema, r.values))
      .and(WithDisplayValues.from(r.displayValues));

    if (typeof r.autoIncrement === 'number') {
      spec = spec.and(new WithRecordAutoIncrement(r.autoIncrement));
    }

    return this.create(spec);
  }
}
