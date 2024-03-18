import { type CommandProps } from '@datalking/pivot-entity';
import { Command } from '@datalking/pivot-entity';

import { type IReorderOptionsCommandInput } from './reorder-options.command.interface';

export class ReorderOptionsCommand
  extends Command
  implements IReorderOptionsCommandInput
{
  public readonly tableId: string;
  public readonly fieldId: string;
  public readonly from: string;
  public readonly to: string;

  constructor(props: CommandProps<IReorderOptionsCommandInput>) {
    super(props);
    this.tableId = props.tableId;
    this.fieldId = props.fieldId;
    this.from = props.from;
    this.to = props.to;
  }
}
