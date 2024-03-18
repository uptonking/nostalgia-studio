import { ValueObject } from '@datalking/pivot-entity';

import { type FieldId } from './field-id.vo';

export class DisplayFields extends ValueObject<FieldId[]> {
  public get ids() {
    return this.props;
  }
}
