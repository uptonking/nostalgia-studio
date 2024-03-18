import React from 'react';

import { useTranslation } from 'react-i18next';

import { useSetSortMutation } from '@datalking/pivot-store';
import {
  Badge,
  Button,
  IconArrowsSort,
  Popover,
  useDisclosure,
} from '@datalking/pivot-ui';

import { useCurrentTable } from '../../hooks/use-current-table';
import { useCurrentView } from '../../hooks/use-current-view';
import { SortsEditor } from '../sorts-editor/sorts-editor';

export const TableSortEditor: React.FC = () => {
  const table = useCurrentTable();
  const view = useCurrentView();

  const [opened, toggle] = useDisclosure(false);
  const [setSortsReq] = useSetSortMutation();
  const sorts = view.sorts?.sorts ?? [];
  const hasSort = !!sorts.length;

  const { t } = useTranslation();

  return (
    <Popover
      opened={opened}
      onChange={toggle.toggle}
      position='bottom-start'
      closeOnClickOutside
      shadow='md'
    >
      <Popover.Target>
        <Button
          compact
          size='xs'
          variant={hasSort ? 'light' : 'subtle'}
          leftIcon={<IconArrowsSort size={16} />}
          onClick={toggle.toggle}
          rightIcon={
            hasSort ? (
              <Badge variant='filled' size='xs'>
                {sorts.length}
              </Badge>
            ) : null
          }
          sx={(theme) => ({
            backgroundColor:
              opened || hasSort
                ? theme.colors[theme.primaryColor][0]
                : 'initial',
          })}
        >
          {t('Sort')}
        </Button>
      </Popover.Target>

      <Popover.Dropdown miw={300}>
        <SortsEditor
          onCancel={toggle.close}
          onApply={(values) => {
            setSortsReq({
              tableId: table.id.value,
              viewId: view.id.value,
              sorts: values,
            }).then(() => toggle.close());
          }}
        />
      </Popover.Dropdown>
    </Popover>
  );
};
