import React, { type ReactNode, useMemo, useRef } from 'react';

import { useSetAtom } from 'jotai';

import { type IKanbanField, type Records } from '@datalking/pivot-core';
import {
  ActionIcon,
  Badge,
  Box,
  Group,
  IconGripVertical,
  IconRowInsertTop,
  Stack,
  Text,
} from '@datalking/pivot-ui';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useVirtualizer } from '@tanstack/react-virtual';

import { useCurrentTable } from '../../hooks/use-current-table';
import { createRecordInitialValueAtom } from '../create-record-form/create-record-initial-value.atom';
import { createRecordFormDrawerOpened } from '../create-record-form/drawer-opened.atom';
import { type SortableProps } from '../sortable.interface';
import { SortableKanbanCard } from './kanban-card';
import { KANBAN_DATE_STACKS } from './kanban-date.utils';
import { KanbanLaneMenu } from './kanban-lane-menu';
import { UNCLASSIFIED_OPTION_ID } from './kanban.constants';

export interface IProps {
  renderMenu?: () => ReactNode;
  id: string | null;
  title: ReactNode;
  field: IKanbanField;
  records: Records;
  disableAddRecord?: boolean;
  getRecordValue?: (id: string | null) => any;
}

type IKanbanLaneProps = IProps & SortableProps;

export const KanbanLane = React.memo(
  ({
    id,
    field,
    setNodeRef,
    setActivatorNodeRef,
    style,
    title,
    attributes = {} as any,
    listeners,
    records,
    disableAddRecord,
    renderMenu,
    getRecordValue,
  }: IKanbanLaneProps) => {
    const setOpened = useSetAtom(createRecordFormDrawerOpened);
    const setCreateRecordInitialValue = useSetAtom(
      createRecordInitialValueAtom,
    );

    const table = useCurrentTable();

    const onCreateRecord = () => {
      setOpened(true);
      if (id && getRecordValue) {
        setCreateRecordInitialValue({ [field.id.value]: getRecordValue(id) });
      }
    };

    const items = useMemo(() => records.map((r) => r.id.value), [records]);
    const len = table.schema.fields.length;

    const tableContainerRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
      count: items.length,
      getScrollElement: () => tableContainerRef.current,
      estimateSize: () => len * 20 + (len - 1) * 8 + 24,
      overscan: 100,
    });
    const paddingTop =
      rowVirtualizer.getVirtualItems().length > 0
        ? rowVirtualizer.getVirtualItems()?.[0]?.start || 0
        : 0;
    const paddingBottom =
      rowVirtualizer.getVirtualItems().length > 0
        ? rowVirtualizer.getTotalSize() -
          (rowVirtualizer.getVirtualItems()?.[
            rowVirtualizer.getVirtualItems().length - 1
          ]?.end || 0)
        : 0;

    return (
      <Stack
        w={350}
        ref={setNodeRef}
        style={style}
        h='100%'
        sx={{ flexShrink: 0 }}
      >
        <Group position='apart' mih={40}>
          <Group spacing='xs'>
            {listeners ? (
              <ActionIcon
                ref={setActivatorNodeRef}
                {...listeners}
                {...attributes}
              >
                <IconGripVertical size={14} cursor='grab' />
              </ActionIcon>
            ) : null}
            {React.isValidElement(title) ? (
              title
            ) : (
              <Text weight={500}>{title}</Text>
            )}
            <Badge color='gray'>{items.length}</Badge>
          </Group>

          {id && renderMenu && (
            <KanbanLaneMenu>{renderMenu?.()}</KanbanLaneMenu>
          )}
        </Group>
        {!disableAddRecord ? (
          <ActionIcon
            w='100%'
            color='gray'
            variant='light'
            onClick={onCreateRecord}
          >
            <IconRowInsertTop />
          </ActionIcon>
        ) : null}

        <Box mb={20} ref={tableContainerRef} h='100%' sx={{ overflow: 'auto' }}>
          <Stack>
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              {paddingTop > 0 && (
                <tr>
                  <td style={{ height: `${paddingTop}px` }} />
                </tr>
              )}
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const r = records[virtualRow.index];
                return <SortableKanbanCard record={r} key={r.id.value} />;
              })}
              {paddingBottom > 0 && (
                <tr>
                  <td style={{ height: `${paddingBottom}px` }} />
                </tr>
              )}
            </SortableContext>
          </Stack>
        </Box>
      </Stack>
    );
  },
);

export const SortableKanbanLane: React.FC<IProps> = (props) => {
  const {
    attributes,
    listeners,
    isDragging,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({
    id: props.id as string,
    disabled:
      props.id === UNCLASSIFIED_OPTION_ID ||
      (!!props.id && KANBAN_DATE_STACKS.includes(props.id as any)),
    data: {
      type: 'container',
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 100 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <KanbanLane
      {...props}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      setActivatorNodeRef={setActivatorNodeRef}
      style={style}
    />
  );
};
