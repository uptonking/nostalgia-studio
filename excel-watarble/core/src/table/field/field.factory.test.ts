import { BoolField } from './bool-field';
import { DateField } from './date-field';
import { DateRangeField } from './date-range-field';
import { FieldFactory } from './field.factory';
import { type Field } from './field.type';
import { NumberField } from './number-field';
import { ParentField } from './parent-field';
import { SelectField } from './select-field';
import { StringField } from './string-field';
import { TreeField } from './tree-field';

it('should create string field', () => {
  const field = FieldFactory.create({
    id: 'fldid',
    type: 'string',
    name: 'hello',
  }) as Field;

  expectTypeOf(field).toEqualTypeOf<Field>();
  expect(field).toBeInstanceOf(StringField);
  expect(field.type).toBe('string');
  expect(field.id.value).toBe('fldid');
});

it('should create number field', () => {
  const field = FieldFactory.create({
    id: 'fldid',
    type: 'number',
    name: 'hello',
  }) as Field;

  expectTypeOf(field).toEqualTypeOf<Field>();
  expect(field).toBeInstanceOf(NumberField);
  expect(field.type).toBe('number');
  expect(field.id.value).toBe('fldid');
});

it('should create date field', () => {
  const field = FieldFactory.create({
    id: 'fldid',
    type: 'date',
    name: 'hello',
  }) as Field;

  expectTypeOf(field).toEqualTypeOf<Field>();
  expect(field).toBeInstanceOf(DateField);
  expect(field.type).toBe('date');
  expect(field.id.value).toBe('fldid');
});

it('should create date range field', () => {
  const field = FieldFactory.create({
    id: 'fldid',
    type: 'date-range',
    name: 'hello',
  }) as Field;

  expectTypeOf(field).toEqualTypeOf<Field>();
  expect(field).toBeInstanceOf(DateRangeField);
  expect(field.type).toBe('date-range');
  expect(field.id.value).toBe('fldid');
});

it('should create select field', () => {
  const field = FieldFactory.create({
    id: 'fldid',
    type: 'select',
    name: 'hello',
    options: [],
  }) as Field;

  expectTypeOf(field).toEqualTypeOf<Field>();
  expect(field).toBeInstanceOf(SelectField);
  expect(field.type).toBe('select');
  expect(field.id.value).toBe('fldid');
});

it('should create bool field', () => {
  const field = FieldFactory.create({
    id: 'fldid',
    type: 'bool',
    name: 'hello',
  }) as Field;

  expectTypeOf(field).toEqualTypeOf<Field>();
  expect(field).toBeInstanceOf(BoolField);
  expect(field.type).toBe('bool');
  expect(field.id.value).toBe('fldid');
});

it('should create tree field & parent field', () => {
  const fields = FieldFactory.create({
    id: 'fieldid',
    type: 'tree',
    name: 'tree',
  }) as Field[];

  expect(Array.isArray(fields)).to.be.true;
  expect(fields).to.have.lengthOf(2);
  expect(fields[0]).to.be.instanceof(TreeField);
  expect(fields[1]).to.be.instanceof(ParentField);
});
