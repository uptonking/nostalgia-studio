import { Option } from 'oxide.ts';
import {
  type IDateRangeFieldQueryValue,
  type IDateRangeFieldValue,
} from './date-range-field.type';
import { FieldValueBase } from './field-value.base';
import { type IFieldValueVisitor } from './field-value.visitor';

export class DateRangeFieldValue extends FieldValueBase<IDateRangeFieldValue> {
  constructor(value: IDateRangeFieldValue) {
    super(value ? value : { value });
  }

  static fromQuery(dateRange: IDateRangeFieldQueryValue) {
    if (dateRange === null) return new this(null);
    return new this([
      dateRange[0] ? new Date(dateRange[0]) : null,
      dateRange[1] ? new Date(dateRange[1]) : null,
    ]);
  }

  unpack() {
    return Array.isArray(this.props) ? this.props : null;
  }

  get from(): Option<Date> {
    return Option(this.unpack()?.[0]);
  }

  get to(): Option<Date> {
    return Option(this.unpack()?.[1]);
  }

  accept(visitor: IFieldValueVisitor): void {
    visitor.dateRange(this);
  }
}
