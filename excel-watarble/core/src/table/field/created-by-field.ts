import { type Option } from 'oxide.ts';
import { type ZodTypeAny } from 'zod';
import { z } from 'zod';

import { type TableCompositeSpecificaiton } from '../specifications/index';
import { CreatedByFieldValue } from './created-by-field-value';
import {
  type CreatedByFieldType,
  type ICreateCreatedByFieldInput,
  type ICreatedByFieldQueryValue,
  type IUpdateCreatedByFieldInput,
} from './created-by-field.type';
import { BaseField } from './field.base';
import { type ICreatedByField } from './field.type';
import { type IFieldVisitor } from './field.visitor';
import { type ICreatedByFilter } from './filter/created-by.filter';
import { type ICreatedByFilterOperator } from './filter/operators';

export class CreatedByField extends BaseField<ICreatedByField> {
  type: CreatedByFieldType = 'created-by';

  override get system() {
    return true;
  }

  override get primitive() {
    return true;
  }

  static default(name: string): CreatedByField {
    return this.create({ name });
  }

  static create(
    input: Omit<ICreateCreatedByFieldInput, 'type'>,
  ): CreatedByField {
    return new CreatedByField({
      ...super.createBase(input),
    });
  }

  static unsafeCreate(input: ICreateCreatedByFieldInput): CreatedByField {
    return new CreatedByField({
      ...super.unsafeCreateBase(input),
    });
  }

  public override update(
    input: IUpdateCreatedByFieldInput,
  ): Option<TableCompositeSpecificaiton> {
    return this.updateBase(input);
  }

  createValue(value: ICreatedByFieldQueryValue): CreatedByFieldValue {
    return CreatedByFieldValue.fromQuery(value);
  }

  createFilter(
    operator: ICreatedByFilterOperator,
    value: string,
  ): ICreatedByFilter {
    return { operator, value, path: this.id.value, type: 'created-by' };
  }

  accept(visitor: IFieldVisitor): void {
    visitor.createdBy(this);
  }

  get valueSchema(): ZodTypeAny {
    return z.any();
  }
}
