import React, { useLayoutEffect } from 'react';

import { useTranslation } from 'react-i18next';
import useDeepCompareEffect from 'use-deep-compare-effect';

import type { ISorts, ISortSchema } from '@datalking/pivot-core';
import {
  Box,
  Button,
  Divider,
  Group,
  IconPlus,
  Stack,
  useListState,
} from '@datalking/pivot-ui';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { useCurrentView } from '../../hooks/use-current-view';
import { FieldSort } from './field-sort';
import { getSortId } from './get-sort-id';

interface IProps {
  onChange?: (filters: ISorts) => void;
  onApply?: (filters: ISorts) => void;
  onCancel?: () => void;
}

export const SortsEditor: React.FC<IProps> = ({
  onChange,
  onApply,
  onCancel,
}) => {
  const view = useCurrentView();
  const initialSorts = view.sorts?.sorts ?? [];
  const [sorts, handlers] = useListState<ISortSchema | null>(
    initialSorts.length ? initialSorts : [null],
  );
  const validSorts = sorts.filter((f) => f !== null) as ISorts;

  const { t } = useTranslation();

  const hasNull = sorts.some((f) => f === null);

  useDeepCompareEffect(() => {
    onChange?.(validSorts);
  }, [validSorts]);

  useLayoutEffect(() => {
    if (sorts.length === 0) {
      handlers.append(null);
    }
  }, [sorts.length]);

  const items = sorts.map(getSortId);

  return (
    <Box>
      <Stack spacing='xs'>
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
            }
          }}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {sorts.map((sort, index) => (
              <FieldSort
                index={index}
                value={sort}
                key={getSortId(sort, index)}
                onChange={(sort, index) => handlers.setItem(index, sort)}
                onRemove={handlers.remove}
              />
            ))}
          </SortableContext>
        </DndContext>
        <Divider />
        <Group position='apart'>
          <Button
            disabled={hasNull}
            variant='outline'
            size='xs'
            leftIcon={<IconPlus size={14} />}
            onClick={() => handlers.append(null)}
          >
            {t('Create New Sort')}
          </Button>
          <Group>
            <Button onClick={onCancel} variant='subtle' size='xs'>
              {t('Cancel', { ns: 'common' })}
            </Button>
            <Button size='xs' onClick={() => onApply?.(validSorts)}>
              {t('Apply', { ns: 'common' })}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Box>
  );
};
