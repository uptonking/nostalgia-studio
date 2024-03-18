import { type Result } from 'oxide.ts';
import { Ok } from 'oxide.ts';
import { DateRangeFieldValue } from '../../field/date-range-field-value';
import { type IDateRangeFieldValue } from '../../field/index';
import { type Record } from '../record';
import { type IRecordVisitor } from './interface';
import { BaseRecordSpecification } from './record-specification.base';

export class DateRangeEqual extends BaseRecordSpecification<DateRangeFieldValue> {
  static from(fieldId: string, value: IDateRangeFieldValue): DateRangeEqual {
    return new this(fieldId, new DateRangeFieldValue(value));
  }

  static fromString(
    fieldId: string,
    value: [string | null, string | null],
  ): DateRangeEqual {
    return new this(
      fieldId,
      new DateRangeFieldValue([
        value[0] ? new Date(value[0]) : null,
        value[1] ? new Date(value[1]) : null,
      ]),
    );
  }

  isSatisfiedBy(r: Record): boolean {
    const value = r.values.value.get(this.fieldId);

    return value instanceof DateRangeFieldValue && value.equals(this.value);
  }

  accept(v: IRecordVisitor): Result<void, string> {
    v.dateRangeEqual(this);
    return Ok(undefined);
  }
}
