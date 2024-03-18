import { arrayMoveImmutable } from 'array-move';
import { Option as O } from 'oxide.ts';

import { ValueObject } from '@datalking/pivot-entity';

import { OptionColor } from './option-color';
import { type OptionKey } from './option-key.vo';
import { Option } from './option';
import {
  type ICreateOptionSchema,
  type ICreateOptionsSchema,
} from './option.schema';
import { createOptionsSchema } from './option.schema';

export class Options extends ValueObject<Option[]> {
  public get options(): Option[] {
    return this.props;
  }

  public get lastOption(): O<Option> {
    return O(this.options[this.options.length - 1]);
  }

  public remove(key: OptionKey): Options {
    return new Options(
      this.options.filter((option) => !option.key.equals(key)),
    );
  }

  public get ids() {
    return this.options.map((o) => o.key.value);
  }

  public reorder(from: string, to: string): Options {
    const formIndex = this.options.findIndex((o) => o.key.value === from);
    const toIndex = this.options.findIndex((o) => o.key.value === to);
    const moved = arrayMoveImmutable(this.options, formIndex, toIndex);
    return new Options(moved);
  }

  public createOption(input: ICreateOptionSchema): Option {
    return Option.create(input);
  }

  public getById(key: string): O<Option> {
    return O(this.options.find((o) => o.key.value === key));
  }

  static create(inputs: ICreateOptionsSchema) {
    inputs = createOptionsSchema.parse(inputs);

    const colors = OptionColor.createColors(inputs.map((i) => i.color));
    const options = inputs.map((input, index) =>
      Option.create({ ...input, color: colors[index] }),
    );

    return new this(options);
  }

  static unsafeCreate(inputs: ICreateOptionsSchema) {
    const options = inputs.map((i) => Option.unsafeCrete(i));
    return new this(options);
  }
}
