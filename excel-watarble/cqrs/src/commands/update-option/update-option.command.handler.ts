import { type ITableRepository } from '@datalking/pivot-core';
import { type ICommandHandler } from '@datalking/pivot-entity';

import { type UpdateOptionCommand } from './update-option.command';

type IUpdateOptionCommandHandler = ICommandHandler<UpdateOptionCommand, void>;

export class UpdateOptionCommandHandler implements IUpdateOptionCommandHandler {
  constructor(protected readonly repo: ITableRepository) {}

  async execute(command: UpdateOptionCommand): Promise<void> {
    const table = (await this.repo.findOneById(command.tableId)).unwrap();

    const spec = table.updateOption(
      command.fieldId,
      command.id,
      command.option,
    );

    await this.repo.updateOneById(table.id.value, spec);
  }
}
