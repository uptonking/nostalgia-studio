import { type ITableRepository } from '@datalking/pivot-core';
import { type ICommandHandler } from '@datalking/pivot-entity';

import { type SetPinnedFieldsCommand } from './set-pinned-fields.command';

export class SetPinnedFieldsCommandHandler
  implements ICommandHandler<SetPinnedFieldsCommand, void>
{
  constructor(protected readonly tableRepo: ITableRepository) {}

  async execute(command: SetPinnedFieldsCommand): Promise<void> {
    const table = (await this.tableRepo.findOneById(command.tableId)).unwrap();

    const spec = table.setPinnedFields(command);

    await this.tableRepo.updateOneById(table.id.value, spec);
  }
}
