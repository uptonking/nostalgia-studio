import { Mixin } from 'ts-mixer';
import { z } from 'zod';

import { andOptions } from '@datalking/pivot-entity';

import { AbstractLookingField, AbstractReferenceField } from './field.base';
import { type IParentField } from './field.type';
import { type IFieldVisitor } from './field.visitor';
import { type IParentFilterOperator } from './filter/operators';
import { type IParentFilter } from './filter/parent.filter';
import { ParentFieldValue } from './parent-field-value';
import {
  type ICreateParentFieldInput,
  type ICreateParentFieldValue,
  type ParentFieldType,
} from './parent-field.type';
import { type IUpdateReferenceFieldInput } from './reference-field.type';
import { DisplayFields, FieldId } from './value-objects/index';

export class ParentField extends Mixin(
  AbstractReferenceField<IParentField>,
  AbstractLookingField<IParentField>,
) {
  type: ParentFieldType = 'parent';

  override get multiple() {
    return false;
  }

  get treeFieldId() {
    return this.props.treeFieldId;
  }

  override get sortable() {
    return false;
  }

  static create(input: Omit<ICreateParentFieldInput, 'type'>): ParentField {
    return new ParentField({
      ...super.createBase(input),
      treeFieldId: FieldId.fromString(input.treeFieldId),
      displayFields: input.displayFieldIds
        ? new DisplayFields(
            input.displayFieldIds.map((id) => FieldId.fromString(id)),
          )
        : undefined,
    });
  }

  static unsafeCreate(input: ICreateParentFieldInput): ParentField {
    return new ParentField({
      ...super.unsafeCreateBase(input),
      treeFieldId: FieldId.fromString(input.treeFieldId),
      displayFields: input.displayFieldIds
        ? new DisplayFields(
            input.displayFieldIds.map((id) => FieldId.fromString(id)),
          )
        : undefined,
    });
  }

  public override update(input: IUpdateReferenceFieldInput) {
    return andOptions(
      this.updateBase(input),
      this.updateDisplayFieldIds(input.displayFieldIds),
    );
  }

  createValue(value: ICreateParentFieldValue): ParentFieldValue {
    return new ParentFieldValue(value);
  }

  createFilter(operator: IParentFilterOperator, value: null): IParentFilter {
    return { operator, value, path: this.id.value, type: 'parent' };
  }

  accept(visitor: IFieldVisitor): void {
    visitor.parent(this);
  }

  get valueSchema() {
    return this.required ? z.string() : z.string().nullable();
  }
}
