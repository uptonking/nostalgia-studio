import { Query } from '@datalking/pivot-entity';

import { type IGetTreeAvailableRecordsQuery } from './get-tree-available-records.query.interface';

export class GetTreeAvailableRecordsQuery
  extends Query
  implements IGetTreeAvailableRecordsQuery
{
  readonly tableId: string;
  readonly treeFieldId: string;
  readonly recordId?: string;
  readonly viewId?: string;

  constructor(query: IGetTreeAvailableRecordsQuery) {
    super();
    this.tableId = query.tableId;
    this.treeFieldId = query.treeFieldId;
    this.recordId = query.recordId;
    this.viewId = query.viewId;
  }
}
