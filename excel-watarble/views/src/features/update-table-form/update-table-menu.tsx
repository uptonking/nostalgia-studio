import React from 'react';

import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useDeleteTableMutation } from '@datalking/pivot-store';
import {
  ActionIcon,
  Group,
  IconDots,
  IconTrash,
  Menu,
  Text,
} from '@datalking/pivot-ui';

import { confirmModal } from '../../hooks';
import { useCurrentTable } from '../../hooks/use-current-table';
import { updateTableFormDrawerOpened } from './drawer-opened.atom';

export const UpdateTableMenu: React.FC = () => {
  const table = useCurrentTable();

  const setOpened = useSetAtom(updateTableFormDrawerOpened);
  const navigate = useNavigate();

  const [deleteTable] = useDeleteTableMutation();

  const confirm = confirmModal({
    async onConfirm() {
      await deleteTable({
        id: table.id.value,
      });
      setOpened(false);
      navigate('/', { replace: true });
    },
  });

  const { t } = useTranslation();

  return (
    <Group w='100%' position='apart'>
      <Text>{t('Update Table')}</Text>
      <Menu width={100}>
        <Menu.Target>
          <ActionIcon>
            <IconDots size={17} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown fz='xs'>
          <Menu.Item
            icon={<IconTrash size={14} />}
            color='red'
            onClick={confirm}
          >
            {t('Delete Table')}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
};
