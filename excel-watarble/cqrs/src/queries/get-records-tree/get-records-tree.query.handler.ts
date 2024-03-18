import {
  type IRecordTreeQueryModel,
  type ITableRepository,
  TreeField,
  WithRecordTableId,
} from '@datalking/pivot-core';
import { type IQueryHandler } from '@datalking/pivot-entity';

import { type IGetRecordsTreeOutput } from './get-records-tree.query.interface';
import { type GetRecordsTreeQuery } from './get-records-tree.query';

export class GetRecordsTreeQueryHandler
  implements IQueryHandler<GetRecordsTreeQuery, IGetRecordsTreeOutput>
{
  constructor(
    protected readonly tableRepo: ITableRepository,
    protected readonly rm: IRecordTreeQueryModel,
  ) {}

  async execute(query: GetRecordsTreeQuery): Promise<IGetRecordsTreeOutput> {
    const table = (await this.tableRepo.findOneById(query.tableId)).unwrap();
    const field = table.schema
      .getFieldByIdOfType(query.fieldId, TreeField)
      .unwrap();
    const filter = table.getSpec(query.viewId);

    const spec = WithRecordTableId.fromString(query.tableId)
      .map((s) => (filter.isNone() ? s : s.and(filter.unwrap())))
      .unwrap();

    const records = await this.rm.findTrees(table.id.value, field, spec);

    return { records };
  }
}
