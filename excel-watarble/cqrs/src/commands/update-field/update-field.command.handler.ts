import { type ITableRepository } from '@datalking/pivot-core';
import { type ICommandHandler } from '@datalking/pivot-entity';

import { type UpdateFieldCommand } from './update-field.command';

type IUpdateFieldCommandHandler = ICommandHandler<UpdateFieldCommand, void>;

export class UpdateFieldCommandHandler implements IUpdateFieldCommandHandler {
  constructor(protected readonly tableRepo: ITableRepository) {}

  async execute(command: UpdateFieldCommand): Promise<void> {
    const table = (await this.tableRepo.findOneById(command.tableId)).unwrap();

    const spec = table.updateField(command.fieldId, command.field);
    if (spec.isSome()) {
      await this.tableRepo.updateOneById(table.id.value, spec.unwrap());
    }
  }
}
