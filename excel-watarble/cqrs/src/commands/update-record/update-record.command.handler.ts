import {
  createMutateRecordValuesSchema,
  type IRecordRepository,
  type ITableRepository,
} from '@datalking/pivot-core';
import { type ICommandHandler } from '@datalking/pivot-entity';

import type * as updateRecordCommandJs from './update-record.command';

export class UpdateRecordCommandHandler
  implements ICommandHandler<updateRecordCommandJs.UpdateRecordCommand, void>
{
  constructor(
    protected readonly tableRepo: ITableRepository,
    protected readonly recordRepo: IRecordRepository,
  ) {}

  async execute(
    command: updateRecordCommandJs.UpdateRecordCommand,
  ): Promise<void> {
    const table = (await this.tableRepo.findOneById(command.tableId)).unwrap();
    const record = (
      await this.recordRepo.findOneById(
        table.id.value,
        command.id,
        table.schema.toIdMap(),
      )
    ).unwrap();
    const schema = createMutateRecordValuesSchema(
      table.schema.fields.filter((field) =>
        Object.keys(command.values).includes(field.id.value),
      ),
    );

    const spec = record.updateRecord(
      table.schema,
      schema.parse(command.values),
    );
    await this.recordRepo.updateOneById(
      table.id.value,
      command.id,
      table.schema.toIdMap(),
      spec,
    );
  }
}
