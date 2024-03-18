import React from 'react';
import { unstable_batchedUpdates } from 'react-dom';

import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Button, IconRowInsertBottom } from '@datalking/pivot-ui';

import { createRecordInitialValueAtom } from '../create-record-form/create-record-initial-value.atom';
import { createRecordFormDrawerOpened } from '../create-record-form/drawer-opened.atom';

export const TableCreateNewRecordButton: React.FC = () => {
  const setOpened = useSetAtom(createRecordFormDrawerOpened);
  const setCreateRecordInitialValue = useSetAtom(createRecordInitialValueAtom);
  const { t } = useTranslation();

  return (
    <Button
      compact
      size='xs'
      leftIcon={<IconRowInsertBottom size={14} />}
      onClick={() => {
        unstable_batchedUpdates(() => {
          setCreateRecordInitialValue({});
          setOpened(true);
        });
      }}
    >
      {t('Create New Record')}
    </Button>
  );
};
