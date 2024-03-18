import { Query } from '@datalking/pivot-entity';

import { type IGetParentAvailableRecordQuery } from './get-parent-available-records.query.interface';

export class GetParentAvailableRecordsQuery
  extends Query
  implements IGetParentAvailableRecordQuery
{
  readonly tableId: string;
  readonly parentFieldId: string;
  readonly recordId?: string;
  readonly viewId?: string;

  constructor(query: IGetParentAvailableRecordQuery) {
    super();
    this.tableId = query.tableId;
    this.parentFieldId = query.parentFieldId;
    this.recordId = query.recordId;
    this.viewId = query.viewId;
  }
}
