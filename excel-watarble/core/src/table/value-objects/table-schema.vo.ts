import { castArray } from 'lodash-es';
import { Option } from 'oxide.ts';
import { type Class } from 'type-fest';
import * as z from 'zod';

import { ValueObject } from '@datalking/pivot-entity';

import { type ClsStore } from '../../cls/cls';
import { CreatedAtField } from '../field/created-at-field';
import { FieldFactory } from '../field/field.factory';
import { IdField } from '../field/id-field';
import {
  type AggregateFieldType,
  type Field,
  type ICreateFieldSchema,
  type IFieldType,
  type LookingFieldTypes,
  type NoneSystemField,
} from '../field/index';
import {
  CreatedByField,
  createFieldSchema,
  DateField,
  DateRangeField,
  ReferenceField,
  SelectField,
  TreeField,
  UpdatedByField,
  WithoutField,
} from '../field/index';
import { UpdatedAtField } from '../field/updated-at-field';
import { fieldNameSchema } from '../field/value-objects/field-name.schema';
import { WithNewField } from '../specifications/table-field.specification';
import { type ICalendarField } from '../view/calendar/index';
import { type IKanbanField, type ITreeViewField } from '../view/index';
import { ViewFieldsOrder } from '../view/view-fields-order.vo';

function hasDuplicates(names: string[]): boolean {
  return names.length === new Set(names).size;
}

const namesSchema = fieldNameSchema.array().refine(hasDuplicates, {
  message: 'field name should not be duplicated',
  path: ['field', 'name'],
});

export const createTableSchemaSchema = z
  .array(createFieldSchema)
  .min(1, { message: 'create table required at least one schema field' })
  .refine((inputs) => hasDuplicates(inputs.map((i) => i.name)), {
    message: 'field name should not duplicated',
  });

export type ICreateTableSchemaInput = z.infer<typeof createTableSchemaSchema>;

export type TableSchemaIdMap = Map<string, Field>;

const lookingFieldTypes: IFieldType[] = [
  'tree',
  'parent',
  'reference',
  'lookup',
];
const aggregateFieldTypes: IFieldType[] = ['count', 'sum', 'average'];

/**
 * Table Schema is a collection of fields
 */
export class TableSchema extends ValueObject<Field[]> {
  static create(inputs: ICreateTableSchemaInput, ctx: ClsStore): TableSchema {
    const fields = createTableSchemaSchema
      .parse(inputs)
      .flatMap(FieldFactory.create);

    return new TableSchema([
      IdField.default(),
      ...fields,
      CreatedAtField.default(ctx.t('createdAt')),
      CreatedByField.default(ctx.t('createdBy')),
      UpdatedAtField.default(ctx.t('updatedAt')),
      UpdatedByField.default(ctx.t('updatedBy')),
    ]);
  }

  static unsafeCreate(inputs: ICreateTableSchemaInput): TableSchema {
    const fields = inputs.map(FieldFactory.unsafeCreate);
    return new TableSchema(fields);
  }

  public toIdMap(): TableSchemaIdMap {
    return new Map(this.fields.map((f) => [f.id.value, f]));
  }

  public get fields(): Field[] {
    return this.props;
  }

  public get nonSystemFields(): NoneSystemField[] {
    return this.fields.filter((f) => !f.isSystem()) as NoneSystemField[];
  }

  public get referenceFields(): ReferenceField[] {
    return this.fields.filter(
      (f) => f instanceof ReferenceField,
    ) as ReferenceField[];
  }

  public get kanbanFields(): IKanbanField[] {
    return this.fields.filter(
      (f) => f instanceof SelectField || f instanceof DateField,
    ) as IKanbanField[];
  }

  public get calendarFields(): ICalendarField[] {
    return this.fields.filter(
      (f) => f instanceof DateField || f instanceof DateRangeField,
    ) as ICalendarField[];
  }

  public get treeFields(): ITreeViewField[] {
    return this.fields.filter(
      (f) => f instanceof TreeField,
    ) as ITreeViewField[];
  }

  get fieldsNames(): string[] {
    return this.props.map((f) => f.name.value);
  }

  get fieldsIds(): string[] {
    return this.props.map((f) => f.id.value);
  }

  private validateNames(...newNames: string[]) {
    const names = [...this.fieldsNames, ...newNames];
    namesSchema.parse(names);
  }

  public getFieldById(id: string): Option<Field> {
    return Option(this.fields.find((f) => f.id.value === id));
  }

  public getFieldByIdOfType<F extends Field>(
    id: string,
    type: Class<F>,
  ): Option<F> {
    return Option(
      this.fields.find((f) => f.id.value === id && f instanceof type) as F,
    );
  }

  public addField(field: Field) {
    this.fields.push(field);
  }

  public get displayFields() {
    return this.fields.filter((f) => f.display);
  }

  public get defaultFieldsOrder(): ViewFieldsOrder {
    const order = this.props.map((v) => v.id.value);
    return ViewFieldsOrder.fromArray(order);
  }

  public createField(input: ICreateFieldSchema): WithNewField[] {
    const fields = FieldFactory.create(input);
    const specs = castArray(fields).map((field) => new WithNewField(field));

    this.validateNames(...specs.map((spec) => spec.field.name.value));

    return specs;
  }

  public removeField(id: string): WithoutField {
    const field = this.getFieldById(id).unwrap();

    if (field.isSystem()) {
      throw new Error('not allowed to delete system field');
    }

    return new WithoutField(field);
  }

  public get lookingFields(): LookingFieldTypes[] {
    return this.fields.filter((f) =>
      lookingFieldTypes.includes(f.type),
    ) as LookingFieldTypes[];
  }

  public get aggregateFields(): AggregateFieldType[] {
    return this.fields.filter((f) =>
      aggregateFieldTypes.includes(f.type),
    ) as AggregateFieldType[];
  }

  public getNextFieldName(fieldName?: string): string {
    if (!fieldName) return `Field (${this.fields.length + 1})`;

    const found = this.fieldsNames.find((n) => n === fieldName);
    if (!found) {
      return fieldName;
    }

    return fieldName + ' (1)';
  }
}
