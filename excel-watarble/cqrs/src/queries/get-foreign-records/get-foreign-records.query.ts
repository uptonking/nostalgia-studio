import { type IRootFilter } from '@datalking/pivot-core';
import { Query } from '@datalking/pivot-entity';

import { type IGetForeignRecordsQuery } from './get-foreign-records.query.interface';

export class GetForeignRecordsQuery
  extends Query
  implements IGetForeignRecordsQuery
{
  readonly tableId: string;
  readonly foreignTableId: string;
  readonly fieldId: string;
  readonly viewId?: string;
  readonly filter?: IRootFilter;

  constructor(query: IGetForeignRecordsQuery) {
    super();
    this.tableId = query.tableId;
    this.foreignTableId = query.foreignTableId;
    this.fieldId = query.fieldId;
    this.viewId = query.viewId;
    this.filter = query.filter;
  }
}
