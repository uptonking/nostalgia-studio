import React, { useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { useMoveViewMutation } from '@datalking/pivot-store';
import {
  Box,
  Button,
  openContextModal,
  Stack,
  useListState,
} from '@datalking/pivot-ui';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useCurrentTable } from '../../hooks/use-current-table';
import { CREATE_VIEW_MODAL_ID } from '../../modals';
import { ViewsListItem } from './views-list-item';

export const ViewsList: React.FC = () => {
  const table = useCurrentTable();
  const views = table.views.views;
  const viewsMap = new Map(views.map((v) => [v.id.value, v]));

  const viewsOrder = table.viewsOrder.order;
  const [order, handlers] = useListState(viewsOrder);

  useEffect(() => {
    handlers.setState(table.viewsOrder.order);
  }, [table]);

  const [moveView] = useMoveViewMutation();

  const { t } = useTranslation();

  return (
    <Stack justify='space-between'>
      <Stack spacing={5}>
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={(e) => {
            const { over, active } = e;
            if (over) {
              handlers.reorder({
                from: active.data.current?.sortable?.index,
                to: over?.data.current?.sortable?.index,
              });

              moveView({
                tableId: table.id.value,
                from: active.id as string,
                to: over.id as string,
              });
            }
          }}
        >
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            {order.map((id) => {
              const v = viewsMap.get(id);
              if (!v) return null;
              return <ViewsListItem key={id} v={v} />;
            })}
          </SortableContext>
        </DndContext>
      </Stack>

      <Box
        pos='fixed'
        bottom={0}
        right={0}
        w='100%'
        p='md'
        bg='white'
        sx={(theme) => ({ borderTop: '1px solid ' + theme.colors.gray[1] })}
      >
        <Button
          variant='light'
          fullWidth
          onClick={() => {
            openContextModal({
              title: t('Create New View'),
              modal: CREATE_VIEW_MODAL_ID,
              innerProps: {},
            });
          }}
        >
          {t('Create New View')}
        </Button>
      </Box>
    </Stack>
  );
};
