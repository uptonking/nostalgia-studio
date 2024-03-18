import { isArray, isBoolean, isEmpty, isString, unzip } from 'lodash-es';
import fp from 'lodash/fp';
import { type Option } from 'oxide.ts';
import { None, Some } from 'oxide.ts';
import { type ZodTypeAny } from 'zod';

import { and, ValueObject } from '@datalking/pivot-entity';

import { type IRecordDisplayValues } from '../record/index';
import { type TableCompositeSpecificaiton } from '../specifications/interface';
import { type TableSchemaIdMap } from '../value-objects/table-schema.vo';
import {
  type IBaseCreateFieldSchema,
  type IBaseUpdateFieldSchema,
} from './field-base.schema';
import { DEFAULT_DATE_FORMAT } from './field.constants';
import {
  type IAbstractAggregateField,
  type IAbstractDateField,
  type IAbstractLookingField,
  type IAbstractLookupField,
  type IAbstractReferenceField,
  type IBaseField,
  type IDateFieldTypes,
  type IFieldType,
  type ILookingFieldTypes,
  type ILookupFieldTypes,
  type INumberAggregateFieldType,
  type IReferenceFieldTypes,
  type IUpdateFieldSchema,
  type PrimitiveField,
  type SystemField,
} from './field.type';
import { canDisplay, isControlledFieldType } from './field.util';
import { type IFieldVisitor } from './field.visitor';
import { type IFilter, type IOperator } from './filter/index';
import { type ReferenceField } from './reference-field';
import { WithAggregateFieldId } from './specifications/aggregate-field.specification';
import {
  WithFieldDescription,
  WithFieldDisplay,
  WithFieldName,
} from './specifications/base-field.specification';
import { WithFormat } from './specifications/date-field.specification';
import { WithFieldRequirement } from './specifications/field-constraints.specification';
import { WithReferenceFieldId } from './specifications/lookup-field.specification';
import { WithDisplayFields } from './specifications/reference-field.specification';
import { type TreeField } from './tree-field';
import { FieldDescription } from './value-objects/field-description';
import { type DateFormat, type FieldIssue } from './value-objects/index';
import {
  DisplayFields,
  FieldId,
  FieldName,
  FieldValueConstraints,
} from './value-objects/index';

const { map, pipe } = fp;

export abstract class BaseField<
  C extends IBaseField = IBaseField,
> extends ValueObject<C> {
  public static createBase(input: IBaseCreateFieldSchema): IBaseField {
    const fieldName = FieldName.create(input.name);

    return {
      id: FieldId.fromNullableString(input.id),
      name: fieldName,
      valueConstrains: FieldValueConstraints.create({
        required: input.required,
      }),
      description: input.description
        ? new FieldDescription({ value: input.description })
        : undefined,
      display: input.display,
    };
  }

  public static unsafeCreateBase(input: IBaseCreateFieldSchema): IBaseField {
    return {
      id: FieldId.fromNullableString(input.id),
      name: FieldName.unsafaCreate(input.name),
      valueConstrains: FieldValueConstraints.unsafeCreate({
        required: input.required,
      }),
      description: input.description
        ? new FieldDescription({ value: input.description })
        : undefined,
      display: input.display,
    };
  }

  abstract type: IFieldType;
  get controlled(): boolean {
    return isControlledFieldType(this.type);
  }
  get system(): boolean {
    return false;
  }
  get primitive(): boolean {
    return false;
  }
  get filterable(): boolean {
    return true;
  }

  get valueConstrains() {
    return this.props.valueConstrains;
  }

  get isNumeric(): boolean {
    return false;
  }

  get sortable(): boolean {
    return true;
  }

  get display(): boolean {
    return this.props.display ?? false;
  }

  set display(display: boolean) {
    this.props.display = display;
  }

  isSystem(): this is SystemField {
    return this.system;
  }

  isPrimitive(): this is PrimitiveField {
    return this.primitive;
  }

  get isAggregate(): boolean {
    return false;
  }

  public get id(): FieldId {
    return this.props.id;
  }

  public get name(): FieldName {
    return this.props.name;
  }

  public set name(name: FieldName) {
    this.props.name = name;
  }

  public get description(): FieldDescription | undefined {
    return this.props.description;
  }

  public set description(description: FieldDescription | undefined) {
    this.props.description = description;
  }

  public get required(): boolean {
    return this.props.valueConstrains.required;
  }

  public set required(required: boolean) {
    this.props.valueConstrains =
      this.props.valueConstrains.setRequired(required);
  }

  abstract get valueSchema(): ZodTypeAny;

  abstract createFilter(operator: IOperator, value: unknown): IFilter;

  abstract accept(visitor: IFieldVisitor): void;

  public get issues(): FieldIssue<string>[] {
    return [];
  }

  public get hasIssue() {
    return !!this.issues.length;
  }

  public update(
    input: IUpdateFieldSchema,
  ): Option<TableCompositeSpecificaiton> {
    return this.updateBase(input);
  }

  protected updateBase<T extends IBaseUpdateFieldSchema>(
    input: T,
  ): Option<TableCompositeSpecificaiton> {
    const specs: TableCompositeSpecificaiton[] = [];
    if (isString(input.name)) {
      const spec = WithFieldName.fromString(this, input.name);
      specs.push(spec);
    }
    if (isString(input.description)) {
      const spec = WithFieldDescription.fromString(this, input.description);
      specs.push(spec);
    }
    if (isBoolean(input.required) && !this.controlled) {
      specs.push(new WithFieldRequirement(this, input.required));
    }
    if (isBoolean(input.display) && canDisplay(this.type)) {
      specs.push(new WithFieldDisplay(this, input.display));
    }
    return and(...specs);
  }
}

export abstract class AbstractReferenceField<
    F extends IReferenceFieldTypes = IReferenceFieldTypes,
  >
  extends BaseField<F>
  implements IAbstractReferenceField
{
  get foreignTableId(): Option<string> {
    return None;
  }
}

export abstract class AbstractDateField<
    F extends IDateFieldTypes = IDateFieldTypes,
  >
  extends BaseField<F>
  implements IAbstractDateField
{
  get formatString(): string {
    return this.props.format?.unpack() ?? DEFAULT_DATE_FORMAT;
  }

  set format(format: DateFormat | undefined) {
    this.props.format = format;
  }

  get format(): DateFormat | undefined {
    return this.props.format;
  }

  updateFormat(
    format?: string | undefined,
  ): Option<TableCompositeSpecificaiton> {
    if (isString(format)) {
      return Some(WithFormat.fromString(this, format));
    }

    return None;
  }
}

export abstract class AbstractLookingField<F extends ILookingFieldTypes>
  extends BaseField<F>
  implements IAbstractLookingField
{
  abstract get multiple(): boolean;

  get displayFieldIds(): FieldId[] {
    return this.props.displayFields?.ids ?? [];
  }

  set displayFieldIds(ids: FieldId[]) {
    this.props.displayFields = new DisplayFields(ids);
  }

  getDisplayValues(values?: IRecordDisplayValues): (string | null)[][] {
    if (isEmpty(this.displayFieldIds)) {
      return pipe(
        map((id: string) => values?.[this.id.value]?.[id] ?? []),
        unzip,
      )(['id']);
    }

    return pipe(
      map(
        (displayFieldId: FieldId) =>
          values?.[this.id.value]?.[displayFieldId.value] ?? [],
      ),
      unzip,
    )(this.displayFieldIds);
  }

  updateDisplayFieldIds(
    displayFieldIds?: string[],
  ): Option<TableCompositeSpecificaiton> {
    if (isArray(displayFieldIds)) {
      return Some(WithDisplayFields.fromIds(this, displayFieldIds));
    }
    return None;
  }
}

export abstract class AbstractLookupField<F extends ILookupFieldTypes>
  extends BaseField<F>
  implements IAbstractLookupField
{
  get referenceFieldId(): FieldId {
    return this.props.referenceFieldId;
  }

  set referenceFieldId(fieldId: FieldId) {
    this.props.referenceFieldId = fieldId;
  }

  getReferenceField(schema: TableSchemaIdMap): ReferenceField | TreeField {
    const referenceField = schema.get(this.referenceFieldId.value);
    if (!referenceField) {
      throw new Error('missing reference field for lookup field');
    }

    return referenceField as ReferenceField | TreeField;
  }
  getForeignTableId(schema: TableSchemaIdMap): Option<string> {
    return this.getReferenceField(schema).foreignTableId;
  }

  updateReferenceId(referenceId?: string): Option<TableCompositeSpecificaiton> {
    if (isString(referenceId)) {
      return Some(WithReferenceFieldId.fromString(this, referenceId));
    }

    return None;
  }
}

export abstract class AbstractAggregateField<
    F extends INumberAggregateFieldType,
  >
  extends BaseField<F>
  implements IAbstractAggregateField
{
  get aggregateFieldId(): FieldId {
    return this.props.aggregateFieldId;
  }

  set referenceFieldId(fieldId: FieldId) {
    this.props.aggregateFieldId = fieldId;
  }

  override get isAggregate() {
    return true;
  }

  updateAggregateFieldId(
    aggregateFieldId?: string,
  ): Option<TableCompositeSpecificaiton> {
    if (isString(aggregateFieldId)) {
      return Some(WithAggregateFieldId.fromString(this, aggregateFieldId));
    }

    return None;
  }
}
