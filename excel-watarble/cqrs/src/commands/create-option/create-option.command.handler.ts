import { type ITableRepository } from '@datalking/pivot-core';
import { type ICommandHandler } from '@datalking/pivot-entity';

import { type CreateOptionCommand } from './create-option.command';

type ICreateOptionCommandHandler = ICommandHandler<CreateOptionCommand, void>;

export class CreateOptionCommandHandler implements ICreateOptionCommandHandler {
  constructor(protected readonly repo: ITableRepository) {}

  async execute(command: CreateOptionCommand): Promise<void> {
    const table = (await this.repo.findOneById(command.tableId)).unwrap();

    const spec = table.createOption(command.fieldId, command.option);

    await this.repo.updateOneById(table.id.value, spec);
  }
}
