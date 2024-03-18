import { Option } from 'oxide.ts';
import { Mixin } from 'ts-mixer';
import { z } from 'zod';

import { andOptions } from '@datalking/pivot-entity';

import { TableId } from '../value-objects/table-id.vo';
import { AbstractLookingField, AbstractReferenceField } from './field.base';
import { type IReferenceField } from './field.type';
import { type IFieldVisitor } from './field.visitor';
import { type IReferenceFilterOperator } from './filter/operators';
import { type IReferenceFilter } from './filter/reference.filter';
import { ReferenceFieldValue } from './reference-field-value';
import {
  type ICreateReferenceFieldInput,
  type ICreateReferenceFieldValue,
  type IReferenceFieldIssues,
  type IUpdateReferenceFieldInput,
  type ReferenceFieldIssue,
  type ReferenceFieldType,
} from './reference-field.type';
import { DisplayFields } from './value-objects/display-fields.vo';
import { FieldId } from './value-objects/field-id.vo';
import { FieldIssue } from './value-objects/field-issue.vo';

export class ReferenceField extends Mixin(
  AbstractReferenceField<IReferenceField>,
  AbstractLookingField<IReferenceField>,
) {
  type: ReferenceFieldType = 'reference';

  get multiple() {
    return true;
  }

  // todo 支持 reference filter
  override get filterable(): boolean {
    return false;
  }

  override get sortable(): boolean {
    return false;
  }

  override get foreignTableId(): Option<string> {
    return Option(this.props.foreignTableId?.value);
  }

  override get issues(): ReferenceFieldIssue[] {
    const issues: ReferenceFieldIssue[] = [];

    if (this.foreignTableId.isNone()) {
      issues.push(
        new FieldIssue<IReferenceFieldIssues>({
          value: 'Missing Foreign Table',
        }),
      );
    }

    return issues;
  }

  get symmetricReferenceFieldId() {
    return this.props.symmetricReferenceFieldId;
  }

  set symmetricReferenceFieldId(fieldId: FieldId | undefined) {
    this.props.symmetricReferenceFieldId = fieldId;
  }

  get isOwner() {
    return this.props.isOwner ?? false;
  }

  static create(
    input: Omit<ICreateReferenceFieldInput, 'type'>,
  ): ReferenceField {
    return new ReferenceField({
      ...super.createBase(input),
      foreignTableId: input.foreignTableId
        ? TableId.from(input.foreignTableId).unwrap()
        : undefined,
      displayFields: input.displayFieldIds
        ? new DisplayFields(
            input.displayFieldIds.map((id) => FieldId.fromString(id)),
          )
        : undefined,
      isOwner: !!input.bidirectional,
      symmetricReferenceFieldId: input.symmetricReferenceFieldId
        ? FieldId.fromString(input.symmetricReferenceFieldId)
        : undefined,
    });
  }

  static unsafeCreate(input: ICreateReferenceFieldInput): ReferenceField {
    return new ReferenceField({
      ...super.unsafeCreateBase(input),
      foreignTableId: input.foreignTableId
        ? TableId.from(input.foreignTableId).unwrap()
        : undefined,
      displayFields: input.displayFieldIds
        ? new DisplayFields(
            input.displayFieldIds.map((id) => FieldId.fromString(id)),
          )
        : undefined,
      isOwner: !!input.bidirectional,
      symmetricReferenceFieldId: input.symmetricReferenceFieldId
        ? FieldId.fromString(input.symmetricReferenceFieldId)
        : undefined,
    });
  }

  public override update(input: IUpdateReferenceFieldInput) {
    return andOptions(
      this.updateBase(input),
      this.updateDisplayFieldIds(input.displayFieldIds),
    );
  }

  createValue(value: ICreateReferenceFieldValue): ReferenceFieldValue {
    return new ReferenceFieldValue(value);
  }

  createFilter(
    operator: IReferenceFilterOperator,
    value: null,
  ): IReferenceFilter {
    return { operator, value, path: this.id.value, type: 'reference' };
  }

  accept(visitor: IFieldVisitor): void {
    visitor.reference(this);
  }

  get valueSchema() {
    return this.required ? z.string().array() : z.string().array().nullable();
  }
}
