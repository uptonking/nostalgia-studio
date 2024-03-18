import { type CommandProps } from '@datalking/pivot-entity';
import { Command } from '@datalking/pivot-entity';

import { type ISetKanbanFieldCommandInput } from './set-kanban-field.command.interface';

export class SetKanbanFieldCommand
  extends Command
  implements ISetKanbanFieldCommandInput
{
  readonly tableId: string;
  readonly viewId?: string;
  readonly field: string;

  constructor(props: CommandProps<ISetKanbanFieldCommandInput>) {
    super(props);
    this.tableId = props.tableId;
    this.viewId = props.viewId;
    this.field = props.field;
  }
}
