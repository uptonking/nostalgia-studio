import { FieldValueConstraints } from './field-value-constraints.vo';

it('should create new constraints object with default required field false', () => {
  const constraint = FieldValueConstraints.create({});

  expect(constraint).toHaveProperty('required', false);
});
