import React, { useLayoutEffect } from 'react';

import { useTranslation } from 'react-i18next';
import useDeepCompareEffect from 'use-deep-compare-effect';

import type { IFilter, IFilterOrGroupList } from '@datalking/pivot-core';
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

import { useCurrentTable } from '../../hooks/use-current-table';
import { useCurrentView } from '../../hooks/use-current-view';
import { FieldFilter } from './field-filter';
import { getFilterId } from './get-filter-id';

interface IProps {
  onChange?: (filters: IFilterOrGroupList) => void;
  onApply?: (filters: IFilterOrGroupList) => void;
  onCancel?: () => void;
}

export const FiltersEditor: React.FC<IProps> = ({
  onChange,
  onApply,
  onCancel,
}) => {
  const table = useCurrentTable();
  const view = useCurrentView();

  const { t } = useTranslation();

  // TODO: ignore group for now
  const initialFilters = view.filterList as IFilter[];
  const [filters, handlers] = useListState<IFilter | null>(
    initialFilters.length ? initialFilters : [null],
  );
  const validFilters = filters.filter((f) => f !== null) as IFilterOrGroupList;

  const hasNull = filters.some((f) => f === null);

  useDeepCompareEffect(() => {
    onChange?.(validFilters);
  }, [validFilters]);

  useLayoutEffect(() => {
    if (filters.length === 0) {
      handlers.append(null);
    }
  }, [filters.length]);
  const items = filters.map(getFilterId);

  return (
    <Box miw={640}>
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
            {filters.map((filter, index) => (
              <FieldFilter
                schema={table.schema}
                index={index}
                value={filter}
                key={getFilterId(filter, index)}
                onChange={(operator, index) =>
                  handlers.setItem(index, operator)
                }
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
            {t('Create New Filter')}
          </Button>
          <Group>
            <Button onClick={onCancel} variant='subtle' size='xs'>
              {t('Cancel', { ns: 'common' })}
            </Button>
            <Button size='xs' onClick={() => onApply?.(validFilters)}>
              {t('Apply', { ns: 'common' })}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Box>
  );
};
