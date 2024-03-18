import { type Result } from 'oxide.ts';
import { Ok } from 'oxide.ts';
import { SelectFieldValue } from '../../field/select-field-value';
import { type Record } from '../record';
import { type IRecordVisitor } from './interface';
import {
  BaseRecordQuerySpecification,
  BaseRecordSpecification,
} from './record-specification.base';

export class SelectEqual extends BaseRecordSpecification<SelectFieldValue> {
  /**
   * check given select is equal to record value by field name
   * @param r - record
   * @returns bool
   */
  isSatisfiedBy(r: Record): boolean {
    const value = r.values.value.get(this.fieldId);
    return value instanceof SelectFieldValue && this.value.equals(value);
  }

  accept(v: IRecordVisitor): Result<void, string> {
    v.selectEqual(this);
    return Ok(undefined);
  }
}

export class SelectIn extends BaseRecordQuerySpecification<SelectFieldValue[]> {
  /**
   * check given select is equal to record value by field name
   * @param r - record
   * @returns bool
   */
  isSatisfiedBy(r: Record): boolean {
    const value = r.values.value.get(this.fieldId);
    if (!(value instanceof SelectFieldValue)) return false;
    const option = value.unpack();
    return !!option && this.value.map((v) => v.id).includes(option);
  }

  accept(v: IRecordVisitor): Result<void, string> {
    v.selectIn(this);
    return Ok(undefined);
  }
}
