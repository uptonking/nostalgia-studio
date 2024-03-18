import { addMilliseconds } from 'date-fns';
import { type SafeParseError } from 'zod';
import {
  dateRangeFieldValue,
  type IDateRangeFieldValue,
} from './date-range-field.type';

const now = new Date();

test.each<[IDateRangeFieldValue, boolean]>([
  [[now, addMilliseconds(now, 1)], false],
  [[now, addMilliseconds(now, -1)], true],
  [[now, now], true],
  [null, false],
])('dateRangeFieldValue', (data, expectError) => {
  const result = dateRangeFieldValue.safeParse(data);

  if (!expectError) {
    expect(result.success).toBe(true);
  } else {
    expect(
      (result as SafeParseError<IDateRangeFieldValue>).error,
    ).toMatchSnapshot();
  }
});
