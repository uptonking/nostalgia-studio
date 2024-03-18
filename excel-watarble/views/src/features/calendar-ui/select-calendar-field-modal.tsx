import React from 'react';

import { type ContextModalProps } from '@datalking/pivot-ui';

import { SelectCalendarField } from './select-calendar-field';
import { type ISelectCalendarFieldProps } from './select-calendar-field.props';

export const SelectCalendarFieldModal = ({
  innerProps,
}: ContextModalProps<ISelectCalendarFieldProps>) => (
  <SelectCalendarField {...innerProps} />
);

export default SelectCalendarFieldModal;
