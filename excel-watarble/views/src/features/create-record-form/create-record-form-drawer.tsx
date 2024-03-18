import React, { useMemo } from 'react';

import { useAtom, useAtomValue } from 'jotai';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import useDeepCompareEffect from 'use-deep-compare-effect';

import { type IMutateRecordValueSchema } from '@datalking/pivot-core';
import { createMutateRecordValuesSchema } from '@datalking/pivot-core';
import { Drawer } from '@datalking/pivot-ui';
import { zodResolver } from '@hookform/resolvers/zod';

import { confirmModal } from '../../hooks';
import { useCurrentTable } from '../../hooks/use-current-table';
import { CreateRecordForm } from './create-record-form';
import { createRecordInitialValueAtom } from './create-record-initial-value.atom';
import { createRecordFormDrawerOpened } from './drawer-opened.atom';

export const CreateRecordFormDrawer = () => {
  const { t } = useTranslation();

  const table = useCurrentTable();
  const [opened, setOpened] = useAtom(createRecordFormDrawerOpened);
  const initialCreateRecordValue = useAtomValue(createRecordInitialValueAtom);

  const defaultValues = useMemo(
    () =>
      table.schema.nonSystemFields.reduce(
        (curr, prev) => ({
          ...curr,
          [prev.id.value]:
            initialCreateRecordValue[prev.id.value] ??
            (prev.type === 'bool' ? false : null),
        }),
        {},
      ),
    [initialCreateRecordValue],
  );

  const schema = createMutateRecordValuesSchema(table.schema.fields);
  const form = useForm<IMutateRecordValueSchema>({
    defaultValues,
    resolver: zodResolver(schema),
    mode: 'onBlur',
    delayError: 300,
    criteriaMode: 'all',
    reValidateMode: 'onChange',
  });

  useDeepCompareEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues]);

  const reset = () => {
    setOpened(false);
    form.clearErrors();
  };
  const confirm = confirmModal({ onConfirm: reset });

  return (
    <FormProvider {...form}>
      <Drawer
        target='body'
        opened={opened}
        withinPortal
        withCloseButton={false}
        trapFocus={false}
        onClose={() => {
          if (form.formState.isDirty) {
            confirm();
          } else {
            reset();
          }
        }}
        title={t('Create New Record')}
        padding='xl'
        position='right'
        size={700}
        overlayProps={{ sx: { zIndex: 198 } }}
        styles={{
          inner: {
            zIndex: 199,
          },
        }}
      >
        <CreateRecordForm onCancel={reset} />
      </Drawer>
    </FormProvider>
  );
};
