import React from 'react';

import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { useDeleteTableMutation } from '@datalking/pivot-store';
import { IconPencil, IconTrash, Menu, Text } from '@datalking/pivot-ui';

import { confirmModal } from '../../hooks';
import { updateTableFormDrawerOpened } from '../update-table-form/drawer-opened.atom';

interface IProps {
  tableId: string;
}

export const TableMenuDropdown: React.FC<IProps> = ({ tableId }) => {
  const { t } = useTranslation();
  const setOpened = useSetAtom(updateTableFormDrawerOpened);

  const [deleteTable] = useDeleteTableMutation();

  const confirm = confirmModal({
    children: <Text size='sm'>{t('Confirm Delete Table')}</Text>,
    onConfirm() {
      deleteTable({
        id: tableId,
      });
    },
  });

  return (
    <>
      <Menu.Item
        fz='xs'
        icon={<IconPencil size={14} />}
        onClick={() => {
          setOpened(true);
        }}
      >
        {t('Update Table')}
      </Menu.Item>

      <Menu.Divider />

      <Menu.Item
        fz='xs'
        icon={<IconTrash size={14} />}
        onClick={confirm}
        color='red'
      >
        {t('Delete Table')}
      </Menu.Item>
    </>
  );
};
