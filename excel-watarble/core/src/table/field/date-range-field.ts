import { type Option } from 'oxide.ts';
import { z } from 'zod';

import { andOptions } from '@datalking/pivot-entity';

import { type TableCompositeSpecificaiton } from '../specifications/interface';
import { DateRangeFieldValue } from './date-range-field-value';
import {
  type DateRangeType,
  type ICreateDateRangeFieldSchema,
  type IDateRangeFieldQueryValue,
  type IUpdateDateRangeFieldInput,
} from './date-range-field.type';
import { AbstractDateField } from './field.base';
import { type IDateRangeField } from './field.type';
import { type IFieldVisitor } from './field.visitor';
import { type IDateRangeFilter } from './filter/date-range.filter';
import { type IDateRangeFilterOperator } from './filter/index';
import { DateFormat } from './value-objects/date-format.vo';

export class DateRangeField extends AbstractDateField<IDateRangeField> {
  type: DateRangeType = 'date-range';

  override get primitive() {
    return true;
  }

  static create(
    input: Omit<ICreateDateRangeFieldSchema, 'type'>,
  ): DateRangeField {
    return new DateRangeField({
      ...super.createBase(input),
      format: input.format ? DateFormat.fromString(input.format) : undefined,
    });
  }

  static unsafeCreate(input: ICreateDateRangeFieldSchema): DateRangeField {
    return new DateRangeField({
      ...super.unsafeCreateBase(input),
      format: input.format ? DateFormat.fromString(input.format) : undefined,
    });
  }

  public override update(
    input: IUpdateDateRangeFieldInput,
  ): Option<TableCompositeSpecificaiton> {
    return andOptions(this.updateBase(input), this.updateFormat(input.format));
  }

  createValue(value: IDateRangeFieldQueryValue): DateRangeFieldValue {
    return DateRangeFieldValue.fromQuery(value);
  }

  createFilter(
    operator: IDateRangeFilterOperator,
    value: [string | null, string | null] | null,
  ): IDateRangeFilter {
    return {
      operator,
      value: value ?? [null, null],
      path: this.id.value,
      type: 'date-range',
    };
  }

  accept(visitor: IFieldVisitor): void {
    visitor.dateRange(this);
  }

  get valueSchema() {
    const dateRange = z.tuple([
      z.string().datetime().nullable(),
      z.string().datetime().nullable(),
    ]);

    return this.required ? dateRange : dateRange.nullable();
  }
}
