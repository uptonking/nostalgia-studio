import { type Result } from 'oxide.ts';
import { Ok } from 'oxide.ts';
import { type FieldId } from '../../field/index';
import { type ITableSpecVisitor } from '../../specifications/index';
import { type Table } from '../../table';
import { type View } from '../view';
import { BaseViewSpecification } from './base-view-specification';

export class WithCalendarField extends BaseViewSpecification {
  constructor(
    public readonly view: View,
    public readonly fieldId: FieldId | null,
  ) {
    super(view);
  }

  isSatisfiedBy(): boolean {
    return this.view.calendarFieldId.mapOr(
      false,
      (fieldId) => !!this.fieldId && fieldId.equals(this.fieldId),
    );
  }

  mutate(t: Table): Result<Table, string> {
    this.view.getOrCreateCalendar().fieldId = this.fieldId ?? undefined;
    return Ok(t);
  }

  accept(v: ITableSpecVisitor): Result<void, string> {
    v.calendarFieldEqual(this);
    return Ok(undefined);
  }
}
