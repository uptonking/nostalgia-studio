import { type Option } from 'oxide.ts';
import { Some } from 'oxide.ts';

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { andOptions } from '@datalking/pivot-entity';

import {
  type ParentField,
  type ReferenceField,
  type TreeField,
} from '../field/index';
import { FieldId, WithSymmetricReferenceField } from '../field/index';
import { type TableCompositeSpecificaiton } from '../specifications/index';
import { type Table } from '../table';
import { AbstractReferenceFieldSpecVisitor } from './abstract-reference-field-spec.visitor';

export class ForeignTableReferenceHandler extends AbstractReferenceFieldSpecVisitor {
  constructor(
    private readonly table: Table,
    private readonly foreignTable: Table,
  ) {
    super();
  }

  #specs: Option<TableCompositeSpecificaiton>[] = [];

  get spec() {
    return andOptions(...this.#specs);
  }

  reference(field: ReferenceField): void {
    const id = FieldId.createId();
    const spec = this.foreignTable.createField(undefined, {
      type: 'reference',
      id,
      foreignTableId: this.table.id.value,
      name: this.foreignTable.schema.getNextFieldName(this.table.name.value),
      symmetricReferenceFieldId: field.id.value,
    });

    this.#specs.push(
      Some(spec),
      Some(WithSymmetricReferenceField.fromString(field, id)),
    );
  }
  tree(field: TreeField): void {}
  parent(field: ParentField): void {}
}
