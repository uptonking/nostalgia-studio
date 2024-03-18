import { v4 } from 'uuid';

export type CommandProps<T> = Omit<T, 'correlationId' | 'commandId'> &
  Partial<Command>;

/**
 * commandId, causationId, correlationId
 */
export abstract class Command {
  /**
   * Command id, in case if we want to save it
   * for auditing purposes and create a correlation/causation chain
   */
  public readonly commandId: string;

  /** ID for correlation purposes (for commands that
   *  arrive from other microservices,logs correlation, etc). */
  public readonly correlationId: string;

  /**
   * Causation id to reconstruct execution order if needed
   */
  public readonly causationId?: string;

  constructor(props: CommandProps<unknown>) {
    this.correlationId = props.correlationId ?? v4();
    this.commandId = props.commandId ?? v4();
  }
}

/** execute command, return promise */
export interface ICommandHandler<TCommand extends Command, TResult> {
  execute(command: TCommand): Promise<TResult>;
}

export interface ICommandBus<TCommand extends Command = Command> {
  execute<TResult>(command: TCommand): Promise<TResult>;
}
