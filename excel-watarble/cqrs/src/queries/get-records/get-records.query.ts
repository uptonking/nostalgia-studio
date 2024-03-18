import { type IRootFilter } from '@datalking/pivot-core';
import { Query } from '@datalking/pivot-entity';

import { type IGetRecordsQuery } from './get-records.query.interface';

export class GetRecordsQuery extends Query implements IGetRecordsQuery {
  readonly tableId: string;
  readonly filter?: IRootFilter;
  readonly viewId?: string;
  constructor(query: IGetRecordsQuery) {
    super();
    this.tableId = query.tableId;
    this.filter = query.filter;
    this.viewId = query.viewId;
  }
}
