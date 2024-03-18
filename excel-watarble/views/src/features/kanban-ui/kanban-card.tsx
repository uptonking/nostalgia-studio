import React, { type CSSProperties } from 'react';

import { useNavigate } from 'react-router-dom';

import { type Record } from '@datalking/pivot-core';
import { Card, Flex, Group, Stack, useEgoUITheme } from '@datalking/pivot-ui';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useCurrentTable } from '../../hooks/use-current-table';
import { FieldIcon } from '../field-inputs/field-Icon';
import { FieldValueFactory } from '../field-value/field-value.factory';
import { type SortableProps } from '../sortable.interface';

interface IProps {
  record: Record;
}

export const KanbanCard: React.FC<IProps & SortableProps> = ({
  record,
  attributes,
  listeners,
  setNodeRef,
  style,
}) => {
  const table = useCurrentTable();
  const navigate = useNavigate();

  return (
    <Card
      py='sm'
      withBorder
      shadow='md'
      radius='xs'
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        navigate(`r/${record.id.value}`);
      }}
    >
      <Stack spacing={8} sx={(theme) => ({ fontSize: theme.fontSizes.sm })}>
        {Object.entries(record.values.valueJSON).map(([key, value]) => {
          const field = table.schema.getFieldById(key);
          if (field.isNone()) return null;
          const f = field.unwrap();
          return (
            <Group spacing='xs' key={key} noWrap mih={20} align='center'>
              <Flex>
                <FieldIcon type={f.type} color='gray' />
              </Flex>
              <FieldValueFactory
                field={f}
                value={value}
                displayValues={record.displayValues?.values}
              />
            </Group>
          );
        })}
      </Stack>
    </Card>
  );
};

export const SortableKanbanCard: React.FC<IProps> = React.memo(({ record }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({
    id: record.id.value,
    data: {
      type: 'card',
    },
  });

  const theme = useEgoUITheme();

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.5 : undefined,
    boxShadow: isDragging ? theme.shadows.xl : theme.shadows.sm,
  };

  return (
    <KanbanCard
      record={record}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      style={style}
    />
  );
});
