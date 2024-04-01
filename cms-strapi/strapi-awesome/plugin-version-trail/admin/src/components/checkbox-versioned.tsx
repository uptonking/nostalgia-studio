import React from 'react';

import { useIntl } from 'react-intl';

import { Checkbox } from '@strapi/design-system';

type CheckboxPTProps = {
  description: {
    id: string;
    defaultMessage: string;
    values: object;
  } | null;
  intlLabel: {
    id: string;
    defaultMessage: string;
    values: object;
  };
  isCreating?: boolean;
  name: string;
  onChange: (...args: any[]) => any;
  value: boolean;
};

export function CheckboxVersioned({
  description = null,
  isCreating = false,
  intlLabel,
  name,
  onChange,
  value,
}: CheckboxPTProps) {
  const { formatMessage } = useIntl();

  const handleChange = (value) => {
    if (isCreating || value) {
      return onChange({ target: { name, value, type: 'checkbox' } });
    }

    return onChange({ target: { name, value: false, type: 'checkbox' } });
  };

  const label = intlLabel.id
    ? formatMessage(
        { id: intlLabel.id, defaultMessage: intlLabel.defaultMessage },
        { ...intlLabel.values },
      )
    : name;

  const hint = description
    ? formatMessage(
        { id: description.id, defaultMessage: description.defaultMessage },
        { ...description.values },
      )
    : '';

  return (
    <Checkbox
      hint={hint}
      id={name}
      name={name}
      onValueChange={handleChange}
      value={value}
      type='checkbox'
    >
      {label}
    </Checkbox>
  );
}
