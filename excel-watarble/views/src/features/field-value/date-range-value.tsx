import React from 'react';

import { format } from 'date-fns/fp';

import {
  type DateRangeField,
  type IDateRangeFieldValue,
} from '@datalking/pivot-core';

interface IProps {
  field: DateRangeField;
  value: IDateRangeFieldValue | undefined;
}

export const DateRangeValue: React.FC<IProps> = ({ field, value }) => {
  if (!value) return null;
  const dateFormat = format(field.formatString);

  const [from, to] = value;
  if (from && to) {
    return <>{`${dateFormat(from)} - ${dateFormat(to)}`}</>;
  }

  if (from) {
    return <>{dateFormat(from)}</>;
  }

  if (to) {
    return <>{dateFormat(to)}</>;
  }
  return null;
};
