import { Ok, type Result } from 'oxide.ts';

import { CompositeSpecification } from '@datalking/pivot-entity';

import { type Table } from '../table';
import {
  DEFAULT_TABLE_EMOJI,
  TableEmoji,
} from '../value-objects/table-emoji.vo';
import { type ITableSpecVisitor } from './interface';

export class WithTableEmoji extends CompositeSpecification {
  constructor(public readonly emoji: TableEmoji) {
    super();
  }

  static fromString(emoji: string = DEFAULT_TABLE_EMOJI): WithTableEmoji {
    return new WithTableEmoji(new TableEmoji(emoji));
  }

  static unsafe(emoji: string): WithTableEmoji {
    return new WithTableEmoji(new TableEmoji(emoji));
  }

  isSatisfiedBy(t: Table): boolean {
    return this.emoji.equals(t.emoji);
  }

  mutate(t: Table): Result<Table, string> {
    t.emoji = this.emoji;
    return Ok(t);
  }

  accept(v: ITableSpecVisitor): Result<void, string> {
    v.emojiEqual(this);
    return Ok(undefined);
  }
}
