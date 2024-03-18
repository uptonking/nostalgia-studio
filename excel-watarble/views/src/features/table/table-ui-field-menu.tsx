import React from 'react';

import { type Field } from '@datalking/pivot-core';
import { ActionIcon, IconDots, Menu } from '@datalking/pivot-ui';
import { type Header } from '@tanstack/react-table';

import { FieldMenuDropdown } from '../field/field-menu-dropdown';
import { type TData } from '../table-ui/interface';

interface IProps {
  field: Field;
  index: number;
  header: Header<TData, unknown>;
}

export const TableUIFieldMenu: React.FC<IProps> = React.memo(
  ({ field, index, header }) => {
    const pinned = header.column.getIsPinned();

    return (
      <Menu width={250}>
        <Menu.Target>
          <ActionIcon size='sm' variant='light'>
            <IconDots size={14} />
          </ActionIcon>
        </Menu.Target>

        <FieldMenuDropdown
          field={field}
          orientation='horizontal'
          index={index}
          pinned={!!pinned}
          pinLeft={() =>
            pinned ? header.column.pin(false) : header.column.pin('left')
          }
        />
      </Menu>
    );
  },
);
