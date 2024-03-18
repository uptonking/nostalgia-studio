import React, { forwardRef } from 'react';

import {
  type IOptionColorName,
  type IOptionColorShade,
  type SelectField,
} from '@datalking/pivot-core';
import { OptionKey } from '@datalking/pivot-core';
import { useCreateOptionMutation } from '@datalking/pivot-store';
import { type SelectProps } from '@datalking/pivot-ui';
import { Group, Select } from '@datalking/pivot-ui';

import { useCurrentTable } from '../../hooks/use-current-table';
import { Option } from './option';

interface IProps extends Omit<SelectProps, 'data'> {
  field: SelectField;
}

export const OptionPicker = forwardRef(({ field, ...rest }: IProps, ref) => {
  const nextColor = field.options.lastOption
    .map((o) => o.color.next())
    .unwrap();
  const [createOption] = useCreateOptionMutation();

  const table = useCurrentTable();

  return (
    <Select
      ref={ref as any}
      data={field.options.options.map((o) => ({
        value: o.key.value,
        label: o.name.value,
        colorName: o.color.name,
        shade: o.color.shade,
      }))}
      clearable
      itemComponent={SelectItem}
      searchable
      creatable
      onCreate={(query) => {
        const key = OptionKey.create().value;
        createOption({
          fieldId: field.id.value,
          tableId: table.id.value,
          option: {
            key,
            name: query,
            color: {
              name: nextColor.name,
              shade: nextColor.shade,
            },
          },
        });
        return key;
      }}
      getCreateLabel={(query) => (
        <Group>
          {`+ Create `}
          <Option
            name={query}
            colorName={nextColor.name}
            shade={nextColor.shade}
          />
        </Group>
      )}
      {...rest}
      withinPortal
    />
  );
});

interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
  value: string;
  label: string;
  colorName: IOptionColorName;
  shade: IOptionColorShade;
}

const SelectItem = forwardRef<HTMLDivElement, ItemProps>(
  ({ value, label, colorName, shade, ...others }: ItemProps, ref) => (
    <Group ref={ref} p='xs' {...others}>
      <Option name={label} colorName={colorName} shade={shade} />
    </Group>
  ),
);
