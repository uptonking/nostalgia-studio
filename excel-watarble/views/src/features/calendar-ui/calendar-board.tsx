import React from 'react';

import { type ICalendarField } from '@datalking/pivot-core';
import { useUpdateRecordMutation } from '@datalking/pivot-store';
import { Grid } from '@datalking/pivot-ui';
import { DndContext, rectIntersection } from '@dnd-kit/core';

import { useCurrentTable } from '../../hooks/use-current-table';
import { CalendarContent } from './calendar-content';
import { CalendarRecords } from './calendar-records';

interface IProps {
  field: ICalendarField;
}

export const CalendarBoard: React.FC<IProps> = ({ field }) => {
  const [updateRecord] = useUpdateRecordMutation();
  const table = useCurrentTable();

  return (
    <DndContext
      collisionDetection={rectIntersection}
      onDragEnd={(e) => {
        const recordId = e.active.id;
        const date = e.over?.id;
        if (date) {
          updateRecord({
            tableId: table.id.value,
            id: recordId as string,
            values: { [field.id.value]: new Date(date) },
          });
        }
      }}
    >
      <Grid h='100%' gutter={0} sx={{ overflow: 'hidden' }}>
        <Grid.Col h='100%' span={2} pb={50}>
          <CalendarRecords field={field} />
        </Grid.Col>
        <Grid.Col h='100%' span={10}>
          <CalendarContent field={field} />
        </Grid.Col>
      </Grid>
    </DndContext>
  );
};

export default CalendarBoard;
