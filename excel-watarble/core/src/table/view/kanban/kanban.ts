import { type Option } from 'oxide.ts';
import { None, Some } from 'oxide.ts';

import { ValueObject } from '@datalking/pivot-entity';

import { type Field } from '../../field/index';
import { FieldId } from '../../field/index';
import { type IKanbanSchema } from './kanban.schema';
import { type IKanban } from './kanban.type';

export class Kanban extends ValueObject<IKanban> {
  static from(input: IKanbanSchema) {
    return new this({
      fieldId: input.fieldId ? FieldId.fromString(input.fieldId) : undefined,
    });
  }

  public get fieldId() {
    return this.props.fieldId;
  }

  public set fieldId(fieldId: FieldId | undefined) {
    this.props.fieldId = fieldId;
  }

  public removeField(field: Field): Option<Kanban> {
    if (this.fieldId?.equals(field.id)) {
      const kanban = new Kanban({ ...this, fieldId: undefined });
      return Some(kanban);
    }

    return None;
  }

  public toJSON() {
    return {
      fieldId: this.fieldId?.value,
    };
  }
}
