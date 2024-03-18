import React from 'react';

import { useTranslation } from 'react-i18next';

import {
  BUILT_IN_DATE_FORMATS,
  DEFAULT_DATE_FORMAT,
} from '@datalking/pivot-core';
import { type SelectItem, type SelectProps } from '@datalking/pivot-ui';
import { Select } from '@datalking/pivot-ui';

import { FieldInputLabel } from '../field-inputs/field-input-label';

const data = BUILT_IN_DATE_FORMATS.map<SelectItem>((format) => ({
  value: format,
  label: format,
}));

type IProps = Omit<SelectProps, 'data'>;

export const DateFormatPicker: React.FC<IProps> = (props) => {
  const { t } = useTranslation();

  return (
    <Select
      withinPortal
      label={<FieldInputLabel>{t('Date Format')}</FieldInputLabel>}
      defaultValue={DEFAULT_DATE_FORMAT}
      {...props}
      data={data}
    />
  );
};
