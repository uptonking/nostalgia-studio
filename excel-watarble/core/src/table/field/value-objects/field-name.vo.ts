import { ValueObject } from '@datalking/pivot-entity';

import { fieldNameSchema } from './field-name.schema';

export class FieldName extends ValueObject<string> {
  private constructor(value: string) {
    super({ value });
  }

  public get value(): string {
    return this.props.value;
  }

  static create(value: string): FieldName {
    return new this(fieldNameSchema.parse(value));
  }

  static unsafaCreate(value: string): FieldName {
    return new this(value);
  }
}
