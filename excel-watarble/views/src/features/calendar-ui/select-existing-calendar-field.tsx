import React from 'react';

import { useSetAtom } from 'jotai';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { setCalendarFieldSchema } from '@datalking/pivot-core';
import { useSetCalendarFieldMutation } from '@datalking/pivot-store';
import {
  Button,
  Card,
  Divider,
  Group,
  IconPlus,
  Radio,
  Stack,
  Text,
} from '@datalking/pivot-ui';
import { zodResolver } from '@hookform/resolvers/zod';

import { useCurrentTable } from '../../hooks/use-current-table';
import { useCurrentView } from '../../hooks/use-current-view';
import { FieldIcon } from '../field-inputs/field-Icon';
import { calendarStepOne, calendarStepTwo } from './calendar-step.atom';

interface IProps {
  onSuccess?: () => void;
}

export const SelectExistingCalendarField: React.FC<IProps> = ({
  onSuccess,
}) => {
  const table = useCurrentTable();
  const view = useCurrentView();

  const calendarFields = table.schema.calendarFields;
  const initialCalendarFieldId = view.calendar.into()?.fieldId?.value;
  const hasCalendarFields = calendarFields.length > 0;

  const [setCalendarField, { isLoading }] = useSetCalendarFieldMutation();

  const form = useForm({
    defaultValues: {
      field: initialCalendarFieldId ?? '',
    },
    resolver: zodResolver(setCalendarFieldSchema),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await setCalendarField({
      tableId: table.id.value,
      viewId: view.id.value,
      field: values.field,
    });

    onSuccess?.();
  });

  const setStepOne = useSetAtom(calendarStepOne);
  const setStepTwo = useSetAtom(calendarStepTwo);
  const { t } = useTranslation();
  return (
    <form onSubmit={onSubmit} style={{ width: '100%' }}>
      <Card shadow='md' withBorder sx={{ overflow: 'visible' }}>
        <Card.Section withBorder inheritPadding py='sm'>
          <Text>{t('Select Calendar Field')}</Text>
        </Card.Section>

        <Card.Section withBorder inheritPadding py='sm'>
          <Stack spacing={0}>
            {hasCalendarFields ? (
              <Controller
                name='field'
                control={form.control}
                render={(f) => (
                  <Radio.Group
                    {...f.field}
                    onChange={(value) => f.field.onChange(value)}
                    withAsterisk
                  >
                    <Stack>
                      {calendarFields.map((f) => (
                        <Radio
                          key={f.id.value}
                          value={f.id.value}
                          label={
                            <Group spacing='xs'>
                              <FieldIcon type={f.type} />
                              {f.name.value}
                            </Group>
                          }
                        />
                      ))}
                    </Stack>
                  </Radio.Group>
                )}
              />
            ) : null}

            {hasCalendarFields && (
              <Divider
                my='xs'
                label={t('or', { ns: 'common' })}
                labelPosition='center'
              />
            )}

            <Button
              size='xs'
              variant='subtle'
              leftIcon={<IconPlus size={14} />}
              onClick={setStepOne}
              rightIcon={<FieldIcon type='date' />}
            >
              {t('Create New Date Field')}
            </Button>
            <Button
              size='xs'
              variant='subtle'
              leftIcon={<IconPlus size={14} />}
              onClick={setStepTwo}
              rightIcon={<FieldIcon type='date-range' />}
            >
              {t('Create New Date Range Field')}
            </Button>
          </Stack>
        </Card.Section>

        <Card.Section withBorder inheritPadding py='sm'>
          <Group position='right'>
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
