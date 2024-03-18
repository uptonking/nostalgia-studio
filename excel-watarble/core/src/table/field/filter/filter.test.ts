import { convertFilterSpec, type IRootFilter, rootFilter } from './filter';

test.each<IRootFilter>([
  {
    type: 'string',
    operator: '$eq',
    path: 'name',
    value: 'hello',
  },
  {
    type: 'string',
    operator: '$contains',
    path: 'name',
    value: 'hello',
  },
  {
    type: 'string',
    operator: '$starts_with',
    path: 'name',
    value: 'starts with',
  },
  {
    type: 'string',
    operator: '$ends_with',
    path: 'name',
    value: 'ends with',
  },
  {
    type: 'number',
    operator: '$neq',
    path: 'name',
    value: 1,
  },
  {
    type: 'number',
    operator: '$neq',
    path: 'name.nested',
    value: 1,
  },
  [
    {
      conjunction: '$and',
      children: [
        {
          type: 'string',
          operator: '$eq',
          path: 'name',
          value: 'hello',
        },
      ],
    },
  ],
  [
    {
      conjunction: '$or',
      children: [
        {
          type: 'string',
          operator: '$eq',
          path: 'name',
          value: 'hello',
        },
      ],
    },
  ],
  {
    type: 'number',
    operator: '$gt',
    path: 'gt',
    value: 1,
  },
  {
    type: 'number',
    operator: '$gte',
    path: 'gte',
    value: 1,
  },
  {
    type: 'number',
    operator: '$lt',
    path: 'lt',
    value: 1,
  },
  {
    type: 'number',
    operator: '$lte',
    path: 'lte',
    value: 1,
  },
  {
    type: 'date',
    operator: '$is_today',
    path: 'is_today',
    value: null,
  },
  {
    type: 'bool',
    operator: '$is_true',
    path: 'field',
    value: true,
  },
  {
    type: 'bool',
    operator: '$is_false',
    path: 'field',
    value: false,
  },
])('should create root filter', (filter) => {
  const parsed = rootFilter.parse(filter);
  expect(parsed).toEqual(filter);

  const spec = convertFilterSpec(filter);
  expect(spec).toMatchSnapshot();
});
