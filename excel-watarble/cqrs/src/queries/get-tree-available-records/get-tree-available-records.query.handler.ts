import { Option } from 'oxide.ts';

import {
  type IRecordQueryModel,
  type ITableRepository,
  TreeAvailableSpec,
  ViewId,
  WithRecordTableId,
} from '@datalking/pivot-core';
import { type IQueryHandler } from '@datalking/pivot-entity';
import { andOptions } from '@datalking/pivot-entity';

import { type IGetTreeAvailableRecordsOutput } from './get-tree-available-records.query.interface';
import { type GetTreeAvailableRecordsQuery } from './get-tree-available-records.query';

export class GetTreeAvailableRecordsQueryHandler
  implements
    IQueryHandler<GetTreeAvailableRecordsQuery, IGetTreeAvailableRecordsOutput>
{
  constructor(
    protected readonly tableRepo: ITableRepository,
    protected readonly rm: IRecordQueryModel,
  ) {}

  async execute(
    query: GetTreeAvailableRecordsQuery,
  ): Promise<IGetTreeAvailableRecordsOutput> {
    const table = (await this.tableRepo.findOneById(query.tableId)).unwrap();
    const spec = andOptions(
      table.getSpec(query.viewId),
      Option(WithRecordTableId.fromString(query.tableId).unwrap()),
      Option(new TreeAvailableSpec(query.treeFieldId, query.recordId)),
    ).unwrap();

    const viewId = query.viewId ? ViewId.fromString(query.viewId) : undefined;
    const records = await this.rm.find(table.id.value, viewId, spec);

    return { records };
  }
}
