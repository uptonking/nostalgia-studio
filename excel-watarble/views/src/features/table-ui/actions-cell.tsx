import React, { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import {
  useDeleteRecordMutation,
  useDuplicateRecordMutation,
} from '@datalking/pivot-store';
import {
  ActionIcon,
  Alert,
  Box,
  Group,
  IconCopy,
  IconDots,
  IconRowInsertBottom,
  IconTrash,
  Menu,
  useClipboard,
} from '@datalking/pivot-ui';
import { type Table } from '@tanstack/react-table';

import { ACTIONS_FIELD } from '../../constants/field.constants';
import { confirmModal } from '../../hooks';
import { useCurrentTable } from '../../hooks/use-current-table';
import { type TData, type TRow } from './interface';

export const ActionsCell: React.FC<{ row: TRow; table: Table<TData> }> = ({
  row,
  table: tb,
}) => {
  const table = useCurrentTable();
  const tableId = table.id.value;

  const { copy } = useClipboard({ timeout: 500 });
  const [deleteRecord, { isLoading }] = useDeleteRecordMutation();

  const confirm = confirmModal({
    children: <Alert color='red'>Confirm to Delete Record {row.id} ?</Alert>,
    confirmProps: { loading: isLoading },
    onConfirm: () => {
      deleteRecord({
        tableId,
        id: row.id,
      });
    },
  });
  const left = useMemo(
    () =>
      tb
        .getFlatHeaders()
        ?.find((h) => h.column.id === ACTIONS_FIELD)
        ?.getStart(),
    [],
  );
  const [duplicateRecord] = useDuplicateRecordMutation();

  const { t } = useTranslation();

  return (
    <Box component='td' sx={{ position: 'absolute', left }}>
      <Group>
        <Menu withinPortal width={200}>
          <Menu.Target>
            <ActionIcon onClick={(e) => e.stopPropagation()} size='sm'>
              <IconDots />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              fz='xs'
              onClick={(e) => {
                e.stopPropagation();
                duplicateRecord({
                  tableId,
                  id: row.id,
                });
              }}
              icon={<IconRowInsertBottom size={14} />}
            >
              {t('Duplicate Record')}
            </Menu.Item>
            <Menu.Item
              fz='xs'
              onClick={(e) => {
                e.stopPropagation();
                copy(row.id);
              }}
              icon={<IconCopy size={14} />}
            >
              {t('Copy Record Id')}
            </Menu.Item>
            <Menu.Item
              fz='xs'
              color='red'
              onClick={(e) => {
                e.stopPropagation();
                confirm();
              }}
              icon={<IconTrash size={14} />}
            >
              {t('Delete Record')}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Box>
  );
};
