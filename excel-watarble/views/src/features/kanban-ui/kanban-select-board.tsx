import React, { useEffect, useState } from 'react';

import { groupBy } from 'lodash-es';
import { useTranslation } from 'react-i18next';

import type {
  Option as CoreOption,
  Record,
  Records,
  SelectField,
  SelectFieldValue,
} from '@datalking/pivot-core';
import {
  useDeleteOptionMutation,
  useReorderOptionsMutation,
  useUpdateRecordMutation,
} from '@datalking/pivot-store';
import {
  Badge,
  Box,
  Button,
  closeAllModals,
  Container,
  Group,
  IconPencil,
  IconPlus,
  IconTrash,
  Menu,
  openContextModal,
  Text,
  useListState,
} from '@datalking/pivot-ui';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';

import { confirmModal } from '../../hooks';
import { useCurrentTable } from '../../hooks/use-current-table';
import { CREATE_OPTION_MODAL_ID, UDPATE_OPTION_MODAL_ID } from '../../modals';
import { Option } from '../option/option';
import type { IUpdateOptionModalProps } from '../update-option-form/update-option-modal';
import { KanbanCard } from './kanban-card';
import { KanbanLane, SortableKanbanLane } from './kanban-lane';
import { UNCLASSIFIED_OPTION_ID } from './kanban.constants';
import { useKanban } from './use-kanban';

interface IProps {
  field: SelectField;
  records: Records;
}

/**
 * ✨ kanban grouped by field of `select` type
 */
export const KanbanSelectBoard = ({ field, records }: IProps) => {
  const { t } = useTranslation();

  const table = useCurrentTable();
  const [options, handlers] = useListState(field.options.options);
  const containers = [
    UNCLASSIFIED_OPTION_ID,
    ...options.map((o) => o.key.value),
  ];
  const lastOption = options[options.length - 1];

  const groupOptionRecords = () =>
    groupBy(records, (record) => {
      const value = record.values.value.get(field.id.value) as
        | SelectFieldValue
        | undefined;

      if (!value?.id) return UNCLASSIFIED_OPTION_ID;
      return value.id;
    });
  const [optionRecords, setOptionRecords] = useState(groupOptionRecords());

  const [reorderOptions] = useReorderOptionsMutation();
  const [deleteOption] = useDeleteOptionMutation();

  const confirm = (id: string) =>
    confirmModal({
      children: <Text size='sm'>{t('Confirm Delete Option')}</Text>,
      onConfirm() {
        deleteOption({
          tableId: table.id.value,
          fieldId: field.id.value,
          id,
        });
      },
    });

  useEffect(() => {
    handlers.setState(field.options.options);
  }, [field]);

  useEffect(() => {
    setOptionRecords(groupOptionRecords());
  }, [records]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [updateRecord] = useUpdateRecordMutation();

  const {
    collisionDetectionStrategy,
    onDragStart,
    onDragOver,
    onDragEnd,
    isActiveContainer,
    activeId,
    activeItem,
    dropAnimation,
    activeContainer,
  } = useKanban<CoreOption, Record>({
    containers,
    items: optionRecords,
    setItems: setOptionRecords,
    getItemId: (item) => item.id.value,
    getActiveItem: (activeId) => records.find((r) => r.id.value === activeId),

    onDragContainerEnd: ({ active, over }) => {
      if (over) {
        handlers.reorder({
          from: active.data.current?.sortable?.index - 1,
          to: over.data.current?.sortable?.index - 1,
        });

        reorderOptions({
          tableId: table.id.value,
          fieldId: field.id.value,
          from: active.id as string,
          to: over.id as string,
        });
      }
    },
    onDragItemEnd: (e, activeContainer, overContainer) => {
      updateRecord({
        tableId: table.id.value,
        id: e.active.id as string,
        values: {
          [field.id.value]:
            overContainer === UNCLASSIFIED_OPTION_ID ? null : overContainer,
        },
      });
    },

    getContainer: (activeId) => options.find((o) => o.key.value === activeId),
  });

  return (
    <Container fluid ml={0} h='100%' pt='xs' sx={{ overflow: 'scroll' }}>
      <Group align='start' noWrap h='100%'>
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          collisionDetection={collisionDetectionStrategy}
        >
          <SortableContext
            items={containers}
            strategy={horizontalListSortingStrategy}
          >
            <SortableKanbanLane
              field={field}
              records={optionRecords[UNCLASSIFIED_OPTION_ID] ?? []}
              title={
                <Badge radius='xs' color='gray' sx={{ textTransform: 'unset' }}>
                  {t('Uncategorized')}
                </Badge>
              }
              id={UNCLASSIFIED_OPTION_ID}
              getRecordValue={(id) =>
                id === UNCLASSIFIED_OPTION_ID ? null : id
              }
            />
            {options.map((option) => (
              <SortableKanbanLane
                field={field}
                records={optionRecords[option.key.value] ?? []}
                key={option.key.value}
                id={option.key.value}
                title={
                  <Option
                    name={option.name.value}
                    colorName={option.color.name}
                    shade={option.color.shade}
                  />
                }
                renderMenu={() => (
                  <>
                    <Menu.Item
                      fz='xs'
                      h={35}
                      icon={<IconPencil size={14} color='gray' />}
                      onClick={() =>
                        openContextModal({
                          title: t('Update Option'),
                          modal: UDPATE_OPTION_MODAL_ID,
                          innerProps: {
                            tableId: table.id.value,
                            field,
                            optionKey: option.key.value,
                            option: {
                              name: option.name.value,
                              color: option.color.unpack(),
                            },
                          } as IUpdateOptionModalProps,
                        })
                      }
                    >
                      {t('Update Option')}
                    </Menu.Item>

                    <Menu.Divider />

                    <Menu.Item
                      icon={<IconTrash size='14' />}
                      color='red'
                      onClick={() => confirm(option.key.value)()}
                      fz='xs'
                      h={35}
                    >
                      {t('Delete Option')}
                    </Menu.Item>
                  </>
                )}
                getRecordValue={(id) =>
                  id === UNCLASSIFIED_OPTION_ID ? null : id
                }
              />
            ))}

            <DragOverlay dropAnimation={dropAnimation}>
              {isActiveContainer ? (
                <KanbanLane
                  field={field}
                  records={optionRecords[(activeId as string) || ''] ?? []}
                  id={activeContainer?.key.value ?? ''}
                  title={
                    <Option
                      name={activeContainer!.name.value}
                      colorName={activeContainer!.color.name}
                      shade={activeContainer!.color.shade}
                    />
                  }
                />
              ) : (
                <KanbanCard record={activeItem!} />
              )}
            </DragOverlay>
          </SortableContext>
        </DndContext>

        <Box pr='md'>
          <Button
            onClick={() =>
              openContextModal({
                title: t('Create New Option'),
                modal: CREATE_OPTION_MODAL_ID,
                trapFocus: true,
                innerProps: {
                  table,
                  field,
                  color: lastOption?.color.next().unpack(),
                  onSuccess: () => closeAllModals(),
                },
              })
            }
            w={300}
            variant='outline'
            leftIcon={<IconPlus />}
          >
            {t('Create New Option')}
          </Button>
        </Box>
      </Group>
    </Container>
  );
};
