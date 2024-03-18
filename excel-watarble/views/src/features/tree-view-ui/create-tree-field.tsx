import React from 'react';

import { useSetAtom } from 'jotai';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { type ICreateTreeFieldSchema } from '@datalking/pivot-core';
import { createTreeFieldSchema, FieldId } from '@datalking/pivot-core';
import {
  useCreateFieldMutation,
  useSetTreeFieldMutation,
} from '@datalking/pivot-store';
import {
  Button,
  Card,
  Group,
  IconChevronLeft,
  Stack,
  Text,
  TextInput,
} from '@datalking/pivot-ui';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCurrentTable } from '../../hooks/use-current-table';
import { useCurrentView } from '../../hooks/use-current-view';
import { CustomDisplayFieldsPicker } from '../field-inputs/custom-display-fields-picker';
import { FieldInputLabel } from '../field-inputs/field-input-label';
import { treeStepZeroAtom } from './tree-step.atom';

interface IProps {
  onSuccess?: () => void;
}

export const CreateTreeField: React.FC<IProps> = ({ onSuccess }) => {
  const table = useCurrentTable();
  const view = useCurrentView();

  const form = useForm<ICreateTreeFieldSchema>({
    defaultValues: {
      type: 'tree',
      name: '',
    },
    resolver: zodResolver(createTreeFieldSchema),
  });

  const [createTreeField, { isLoading }] = useCreateFieldMutation();
  const [setKanbanField] = useSetTreeFieldMutation();

  const onSubmit = form.handleSubmit(async (values) => {
    values.id = FieldId.createId();
    await createTreeField({
      tableId: table.id.value,
      field: values,
    });
    await setKanbanField({
      tableId: table.id.value,
      viewId: view.id.value,
      field: values.id,
    });
    setStepZero();
    onSuccess?.();
  });

  const setStepZero = useSetAtom(treeStepZeroAtom);

  const { t } = useTranslation();
  return (
    <form onSubmit={onSubmit}>
      <Card shadow='sm' withBorder radius={0} sx={{ overflow: 'visible' }}>
        <Card.Section withBorder inheritPadding py='sm'>
          <Text>{t('Create New Tree Field')}</Text>
        </Card.Section>

        <Card.Section withBorder inheritPadding py='sm'>
          <Stack spacing='xs'>
            <TextInput
              label={
                <FieldInputLabel>{t('Name', { ns: 'common' })}</FieldInputLabel>
              }
              {...form.register('name')}
              autoFocus
              placeholder={t('Field Name') as string}
            />
            <Controller
              control={form.control}
              name={`parentFieldName`}
              render={(props) => (
                <TextInput
                  label={
                    <FieldInputLabel>{t('Parent Field Name')}</FieldInputLabel>
                  }
                  {...props.field}
                  value={props.field.value ?? ''}
                  placeholder={t('Field Name') as string}
                />
              )}
            />
            <Controller
              control={form.control}
              name='displayFieldIds'
              render={(props) => (
                <CustomDisplayFieldsPicker
                  variant='default'
                  foreignTableId={table.id.value}
                  dropdownPosition='bottom'
                  {...props.field}
                  onChange={(ids) => props.field.onChange(ids)}
                  fieldFilter={(f) => f.isPrimitive()}
                  placeholder={t('Select Display Fields') as string}
                  label={
                    <FieldInputLabel>{t('Display Fields')}</FieldInputLabel>
                  }
                />
              )}
            />
          </Stack>
        </Card.Section>

        <Card.Section withBorder inheritPadding py='sm'>
          <Group position='right'>
            <Button
              leftIcon={<IconChevronLeft size={14} />}
              size='xs'
              variant='white'
              onClick={setStepZero}
            >
              {t('Select Existing Field')}
            </Button>
            <Button
              size='xs'
              type='submit'
              disabled={!form.formState.isValid}
              loading={isLoading}
            >
              {t('Done', { ns: 'common' })}
            </Button>
          </Group>
        </Card.Section>
      </Card>
    </form>
  );
};
