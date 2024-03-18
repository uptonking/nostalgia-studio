import { type IFieldType } from './field.type';

const controlledFieldTypes: Set<IFieldType> = new Set([
  'id',
  'auto-increment',
  'created-at',
  'updated-at',
  'count',
  'sum',
  'average',
  'lookup',
]);

export const isControlledFieldType = (type: IFieldType): boolean =>
  controlledFieldTypes.has(type);

const displayFieldTypes: Set<IFieldType> = new Set<IFieldType>([
  'auto-increment',
  'color',
  'date',
  'email',
  // FIXME: 支持选择 attachment 作为 display field
  // 'attachment',
  'number',
  'rating',
  'string',
]);

export const canDisplay = (type: IFieldType): boolean =>
  displayFieldTypes.has(type);
