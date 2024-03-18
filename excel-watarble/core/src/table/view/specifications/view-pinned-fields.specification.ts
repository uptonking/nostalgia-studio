import { type Result } from 'oxide.ts';
import { Ok } from 'oxide.ts';
import { type ITableSpecVisitor } from '../../specifications/index';
import { type Table } from '../../table';
import { type ViewPinnedFields } from '../view-pinned-fields';
import { type View } from '../view';
import { BaseViewSpecification } from './base-view-specification';

export class WithViewPinnedFields extends BaseViewSpecification {
  constructor(
    public readonly pinnedFields: ViewPinnedFields,
    public readonly view: View,
  ) {
    super(view);
  }

  isSatisfiedBy(): boolean {
    return this.pinnedFields.equals(this.view.pinnedFields);
  }

  mutate(t: Table): Result<Table, string> {
    this.view.pinnedFields = this.pinnedFields;
    return Ok(t);
  }

  accept(v: ITableSpecVisitor): Result<void, string> {
    v.pinnedFields(this);
    return Ok(undefined);
  }
}
