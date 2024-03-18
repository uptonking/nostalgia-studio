import React, { useMemo } from 'react';

import { type ICalendarField, type IQueryRecords } from '@datalking/pivot-core';
import { RecordFactory } from '@datalking/pivot-core';
import { Calendar } from '@datalking/pivot-ui';

import { useCurrentTable } from '../../hooks/use-current-table';
import { useFetchRecords } from '../../hooks/use-fetch-records';
import { Day } from './day';

interface IProps {
  field: ICalendarField;
}
export const CalendarContent: React.FC<IProps> = ({ field }) => {
  const table = useCurrentTable();

  const { rawRecords, isLoading, isFetching } = useFetchRecords([
    { path: field.id.value, type: 'date', value: null, operator: '$neq' },
  ]);

  const records = useMemo(
    () => RecordFactory.fromQueryRecords(rawRecords, table.schema.toIdMap()),
    [rawRecords, isLoading, isFetching],
  );

  return (
    <Calendar
      h='100%'
      w='100%'
      bg='white'
      size='xl'
      withCellSpacing={false}
      hasNextLevel={false}
      renderDay={(date) => <Day field={field} records={records} date={date} />}
      styles={(theme) => {
        const border = `1px solid ${
          theme.colorScheme === 'dark'
            ? theme.colors.dark[4]
            : theme.colors.gray[1]
        }`;
        return {
          calendarHeader: {
            backgroundColor: theme.white,
            marginBottom: 0,
            padding: 10,
            borderLeft: border,
            height: '40px',
            maxWidth: '100%',
            width: '100%',
          },
          calendarHeaderControl: {
            height: '100%',
          },
          calendarHeaderLevel: {
            flex: 1,
            // visibility: 'hidden',
            width: '100%',
            height: '100%',
            fontSize: theme.fontSizes.lg,
          },
          month: {
            width: '100%',
            height: 'calc(100% - 40px)',
          },
          monthLevelGroup: {
            height: '100%',
          },
          monthRow: {
            height: 'calc(100% / 6)',
          },
          cell: {
            overflowY: 'scroll',
            border,
          },
          day: {
            cursor: 'unset',
            borderRadius: 0,
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            fontSize: theme.fontSizes.sm,
            justifyContent: 'flex-start',
            border: '1px solid ' + theme.colors.gray[1],
            borderRight: 0,
            borderBottom: 0,
          },
          weekday: { fontSize: theme.fontSizes.lg },
          weekdayCell: {
            fontSize: theme.fontSizes.xs,
            border,
            height: 20,
          },
        };
      }}
    />
  );
};
