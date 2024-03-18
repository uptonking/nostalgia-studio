import { type ITableQueryModel } from '@datalking/pivot-core';
import { type IQueryHandler } from '@datalking/pivot-entity';

import { type GetTablesQuery } from './get-tables.query';
import { type IGetTablesOutput } from './get-tables.query.interface';

export class GetTablesQueryHandler
  implements IQueryHandler<GetTablesQuery, IGetTablesOutput>
{
  constructor(protected readonly rm: ITableQueryModel) {}

  async execute(query: GetTablesQuery): Promise<IGetTablesOutput> {
    const tables = await this.rm.find();

    return tables;
  }
}
