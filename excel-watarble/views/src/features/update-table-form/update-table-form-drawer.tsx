import React from 'react';

import { useAtom } from 'jotai';
import { FormProvider, useForm } from 'react-hook-form';
import useDeepCompareEffect from 'use-deep-compare-effect';

import { type IUpdateTableSchema } from '@datalking/pivot-core';
import { DEFAULT_TABLE_EMOJI, updateTableSchema } from '@datalking/pivot-core';
import { Drawer } from '@datalking/pivot-ui';
import { zodResolver } from '@hookform/resolvers/zod';

import { confirmModal } from '../../hooks';
import { useCurrentTable } from '../../hooks/use-current-table';
import { updateTableFormDrawerOpened } from './drawer-opened.atom';
import { UpdateTableForm } from './update-table-form';
import { UpdateTableMenu } from './update-table-menu';

export const UpdateTableFormDrawer: React.FC = () => {
  const table = useCurrentTable();

  const [opened, setOpened] = useAtom(updateTableFormDrawerOpened);

  const defaultValues: IUpdateTableSchema = {
    emoji: table.emoji.unpack() ?? DEFAULT_TABLE_EMOJI,
    name: table.name.value,
  };

  useDeepCompareEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues]);

  const form = useForm<IUpdateTableSchema>({
    defaultValues,
    resolver: zodResolver(updateTableSchema),
  });

  const reset = () => {
    setOpened(false);
    form.clearErrors();
    form.reset();
  };
  const confirm = confirmModal({ onConfirm: reset });

  return (
    <FormProvider {...form}>
      <Drawer
        target='body'
        opened={opened}
        withCloseButton={false}
        onClose={() => {
          if (form.formState.isDirty) {
            confirm();
          } else {
            reset();
          }
        }}
        title={<UpdateTableMenu />}
        padding='xl'
        position='right'
        styles={{
          title: {
            width: '100%',
          },
        }}
        size={700}
      >
        <UpdateTableForm onCancel={() => setOpened(false)} />
      </Drawer>
    </FormProvider>
  );
};
