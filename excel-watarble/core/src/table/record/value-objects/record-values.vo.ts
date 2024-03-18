import { Option } from 'oxide.ts';

import { ValueObject } from '@datalking/pivot-entity';

import {
  type FieldValue,
  type ICreateFieldsSchema_internal,
  type UnpackedFieldValue,
} from '../../field/index';
import { TreeField } from '../../field/index';
import { type TableSchemaIdMap } from '../../value-objects/index';
import { type RecordValueJSON } from '../record.schema';
import { type IQueryRecordValues } from '../record.type';

export class RecordValues extends ValueObject<Map<string, FieldValue>> {
  static fromArray(inputs: ICreateFieldsSchema_internal): RecordValues {
    const values = new Map(
      inputs.map((v) => [
        v.field.id.value,
        v.field.createValue(v.value as never),
      ]),
    );
    return new RecordValues(values);
  }

  static fromObject(
    schema: TableSchemaIdMap,
    inputs: IQueryRecordValues,
  ): RecordValues {
    const values = new Map();
    for (const [fieldId, fieldValue] of Object.entries(inputs)) {
      const field = schema.get(fieldId);
      if (!field) continue;
      values.set(fieldId, field.createValue(fieldValue as never));
    }

    return new RecordValues(values);
  }

  static empty(): RecordValues {
    return new RecordValues(new Map());
  }

  public get value() {
    return this.props;
  }

  public get valueJSON(): RecordValueJSON {
    return Object.fromEntries(this.value);
  }

  *[Symbol.iterator]() {
    yield* this.value.entries();
  }

  setValue(fieldId: string, value: FieldValue) {
    this.value.set(fieldId, value);
  }

  /**
   * get unpacked field value
   *
   * @param id - field id
   * @returns unpacked field value
   */
  getUnpackedValue(id: string): Option<UnpackedFieldValue> {
    return Option.nonNull(this.value.get(id)).map((v) => v.unpack());
  }

  /**
   * duplicate record values
   *
   * - remove tree value
   *
   * @param schema - table schema
   */
  duplicate(schema: TableSchemaIdMap): RecordValues {
    const props = new Map();

    for (const [fieldId, fieldValue] of this.props.entries()) {
      const field = schema.get(fieldId);
      if (!field) continue;

      if (field instanceof TreeField) continue;

      props.set(fieldId, fieldValue);
    }

    return new RecordValues(props);
  }
}
