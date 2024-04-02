import React, { useCallback, useMemo } from 'react';

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

  const handleCheckboxChange = useCallback(
    (value) => {
      if (isCreating || value) {
        return onChange({ target: { name, value, type: 'checkbox' } });
      }
      return onChange({ target: { name, value: false, type: 'checkbox' } });
    },
    [isCreating, name, onChange],
  );

  const label = useMemo(
    () =>
      intlLabel.id
        ? formatMessage(
            { id: intlLabel.id, defaultMessage: intlLabel.defaultMessage },
            { ...intlLabel.values },
          )
        : name,
    [
      formatMessage,
      intlLabel.defaultMessage,
      intlLabel.id,
      intlLabel.values,
      name,
    ],
  );

  const hint = useMemo(
    () =>
      description
        ? formatMessage(
            { id: description.id, defaultMessage: description.defaultMessage },
            { ...description.values },
          )
        : '',
    [description, formatMessage],
  );

  return (
    <Checkbox
      hint={hint}
      id={name}
      name={name}
      onValueChange={handleCheckboxChange}
      value={value}
      type='checkbox'
    >
      {label}
    </Checkbox>
  );
}
