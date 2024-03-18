import { DateVO } from '@datalking/pivot-entity';

import { type ICollaboratorProfile } from '../field/collaborator-field.type';
import {
  type TableId,
  type TableSchema,
  type TableSchemaIdMap,
} from '../value-objects/index';
import { RecordFactory } from './record.factory';
import {
  type IInternalRecordValues,
  type IMutateRecordValueSchema,
  type RecordAllValues,
} from './record.schema';
import { createRecordInputs } from './record.utils';
import {
  WithRecordId,
  WithRecordTableId,
  WithRecordValues,
} from './specifications/index';
import { type RecordCompositeSpecification } from './specifications/interface';
import { RecordId, RecordValues } from './value-objects/index';
import { RecordDisplayValues } from './value-objects/record-display-values.vo';

export class Record {
  public id: RecordId = RecordId.create();
  public tableId!: TableId;
  public values: RecordValues = RecordValues.empty();
  public displayValues?: RecordDisplayValues = RecordDisplayValues.empty();
  public createdAt: DateVO = DateVO.now();
  public createdBy!: string;
  public createdByProfile: ICollaboratorProfile | null = null;
  public updatedBy!: string;
  public updatedByProfile: ICollaboratorProfile | null = null;
  public updatedAt: DateVO = DateVO.now();
  public autoIncrement?: number;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static empty() {
    const record = new Record();

    return record;
  }

  get internalValuesJSON(): IInternalRecordValues {
    return {
      id: this.id.value,
      created_at: this.createdAt.value.toISOString(),
      created_by: this.createdBy,
      created_by_profile: this.createdByProfile,
      updated_at: this.updatedAt.value.toISOString(),
      updated_by: this.updatedBy,
      updated_by_profile: this.updatedByProfile,
      auto_increment: this.autoIncrement,
      display_values: this.displayValues?.values,
    };
  }

  get valuesJSON(): RecordAllValues {
    return Object.assign({}, this.internalValuesJSON, this.values.valueJSON);
  }

  updateRecord(
    schema: TableSchema,
    value: IMutateRecordValueSchema,
  ): RecordCompositeSpecification {
    const inputs = createRecordInputs(schema, value);
    const spec = WithRecordValues.fromArray(inputs);

    spec.mutate(this);

    return spec;
  }

  duplicate(schema: TableSchemaIdMap): Record {
    return RecordFactory.create(
      new WithRecordId(RecordId.create())
        .and(new WithRecordTableId(this.tableId))
        .and(new WithRecordValues(this.values.duplicate(schema))),
    ).unwrap();
  }
}
