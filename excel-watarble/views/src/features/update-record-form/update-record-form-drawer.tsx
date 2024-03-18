import React, { useEffect, useMemo } from 'react';

import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import {
  type IFieldQueryValue,
  type IMutateRecordValueSchema,
} from '@datalking/pivot-core';
import { createMutateRecordValuesSchema } from '@datalking/pivot-core';
import { useGetRecordQuery } from '@datalking/pivot-store';
import {
  ActionIcon,
  Drawer,
  IconChevronRight,
  LoadingOverlay,
  useDebouncedValue,
  useDisclosure,
} from '@datalking/pivot-ui';
import { zodResolver } from '@hookform/resolvers/zod';

import { confirmModal } from '../../hooks';
import { useCurrentTable } from '../../hooks/use-current-table';
import { useCurrentView } from '../../hooks/use-current-view';
import { useOrderedFields } from '../../hooks/use-ordered-fields';
import { UpdateRecordForm } from './update-record-form';

export const UpdateRecordFormDrawer: React.FC<{ recordId: string }> = ({
  recordId,
}) => {
  const navigate = useNavigate();
  const table = useCurrentTable();
  const view = useCurrentView();
  const fields = useOrderedFields();

  const [opened, handler] = useDisclosure();

  useEffect(() => {
    if (!opened) {
      setTimeout(() => {
        handler.open();
      }, 0);
    }
  }, []);

  const { data, isFetching } = useGetRecordQuery(
    { id: recordId, tableId: table.id.value },
    { skip: !recordId },
  );

  const [deboundedIsFetching] = useDebouncedValue(isFetching, 200);

  const defaultValues = useMemo(
    () =>
      fields.reduce((curr, field) => {
        let value: IFieldQueryValue | undefined;

        if (field.type === 'id') {
          value = data?.id;
        } else if (field.type === 'created-at') {
          value = data?.createdAt;
        } else if (field.type === 'updated-at') {
          value = data?.updatedAt;
        } else if (field.type === 'auto-increment') {
          value = data?.autoIncrement;
        } else {
          value = data?.values?.[field.id.value] ?? null;
        }
        return {
          ...curr,
          [field.id.value]: value,
        };
      }, {}),
    [data],
  );

  const form = useForm<IMutateRecordValueSchema>({
    defaultValues,
    resolver: zodResolver(createMutateRecordValuesSchema(table.schema.fields)),
    mode: 'onBlur',
    delayError: 300,
    criteriaMode: 'all',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [data, defaultValues, form]);

  const reset = () => {
    navigate('..');
    form.reset();
  };
  const confirm = confirmModal({ onConfirm: reset });

  const { t } = useTranslation();

  return (
    <FormProvider {...form}>
      <Drawer.Root
        target='body'
        opened={opened}
        withinPortal
        trapFocus={false}
        onClose={() => {
          if (form.formState.isDirty) {
            confirm();
          } else {
            reset();
          }
        }}
        padding='xl'
        position='right'
        size='xl'
        styles={{
          inner: {
            zIndex: 102,
          },
        }}
      >
        <Drawer.Content sx={{ position: 'relative', overflow: 'visible' }}>
          <Drawer.Header
            sx={(theme) => ({
              zIndex: 1000,
              borderBottom: '1px solid ' + theme.colors.gray[2],
            })}
          >
            {t('Update Record')}
          </Drawer.Header>
          <Drawer.Body
            pb='80px'
            h='calc(100% - 80px)'
            sx={{ overflow: 'scroll' }}
          >
            <LoadingOverlay visible={deboundedIsFetching} />
            <UpdateRecordForm onCancel={reset} />
          </Drawer.Body>
          <ActionIcon
            onClick={() => {
              handler.close();
              setTimeout(() => {
                navigate('..');
              }, 300);
            }}
            variant='default'
            radius='xl'
            size='xl'
            sx={(theme) => ({
              position: 'fixed',
              top: 'calc(50% - 40px)',
              left: '-22px',
              backgroundColor: theme.white,
              boxShadow: theme.shadows.xl,
              transition: '0.4s',
              zIndex: 10000,
              border: '1px solid ' + theme.colors.gray[1],
              ':hover': {
                boxShadow: theme.shadows.md,
              },
            })}
          >
            <IconChevronRight size={16} />
          </ActionIcon>
        </Drawer.Content>
      </Drawer.Root>
    </FormProvider>
  );
};
