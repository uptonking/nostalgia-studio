import { isEqual } from 'date-fns';

import { type ValueObject } from '@datalking/pivot-entity';

import { type IDateFieldValue } from './date-field.type';
import { FieldValueBase } from './field-value.base';
import { type IFieldValueVisitor } from './field-value.visitor';

export class DateFieldValue extends FieldValueBase<IDateFieldValue> {
  constructor(value: IDateFieldValue) {
    super({ value });
  }

  static fromString(str: string): DateFieldValue {
    return new this(new Date(str));
  }

  static fromNullableString(str: string | null): DateFieldValue {
    if (str === null) return new this(null);
    return new this(new Date(str));
  }

  public equals(vo?: ValueObject<Date | null> | undefined): boolean {
    if (!this.props.value) return !vo?.unpack();
    if (!vo?.unpack()) return !this.props.value;
    return isEqual(this.props.value, vo?.unpack() as Date);
  }

  public static now(): DateFieldValue {
    return new this(new Date());
  }

  public toString(): string | undefined {
    return this.props.value?.toISOString();
  }

  accept(visitor: IFieldValueVisitor): void {
    visitor.date(this);
  }
}
