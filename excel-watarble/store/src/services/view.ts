// @ts-nocheck

import { trpc } from '../trpc';
import { api } from './api';

const viewApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createView: builder.mutation({
      query: trpc.table.view.create.mutate,
      invalidatesTags: (_, __, { tableId }) => [
        { type: 'Table', id: tableId },
        'Record',
      ],
    }),
    moveView: builder.mutation({
      query: trpc.table.view.move.mutate,
      invalidatesTags: (_, __, { tableId }) => [{ type: 'Table', id: tableId }],
    }),
    duplicateView: builder.mutation({
      query: trpc.table.view.duplicate.mutate,
      invalidatesTags: (_, __, { tableId }) => [{ type: 'Table', id: tableId }],
    }),
    updateViewName: builder.mutation({
      query: trpc.table.view.updateName.mutate,
      invalidatesTags: (_, __, { tableId }) => [{ type: 'Table', id: tableId }],
    }),
    deleteView: builder.mutation({
      query: trpc.table.view.delete.mutate,
      invalidatesTags: (_, __, { tableId }) => [{ type: 'Table', id: tableId }],
    }),
    setFilter: builder.mutation({
      query: trpc.table.view.filter.set.mutate,
      invalidatesTags: (_, __, { tableId }) => [
        { type: 'Table', id: tableId },
        'Record',
      ],
    }),
    setSort: builder.mutation({
      query: trpc.table.view.sort.set.mutate,
      invalidatesTags: (_, __, { tableId }) => [
        { type: 'Table', id: tableId },
        'Record',
      ],
    }),
    setFieldSort: builder.mutation({
      query: trpc.table.view.sort.setFieldSort.mutate,
      invalidatesTags: (_, __, { tableId }) => [
        { type: 'Table', id: tableId },
        'Record',
      ],
    }),
    resetFieldSort: builder.mutation({
      query: trpc.table.view.sort.resetFieldSort.mutate,
      invalidatesTags: (_, __, { tableId }) => [
        { type: 'Table', id: tableId },
        'Record',
      ],
    }),
    switchDisplayType: builder.mutation({
      query: trpc.table.view.switchDisplayType.mutate,
      invalidatesTags: (_, __, { tableId }) => [{ type: 'Table', id: tableId }],
    }),
    setShowSystemFields: builder.mutation({
      query: trpc.table.view.setShowSystemFields.mutate,
      invalidatesTags: (_, __, { tableId }) => [
        { type: 'Table', id: tableId },
        'Record',
        'TreeRecord',
      ],
    }),
    setPinnedFields: builder.mutation({
      query: trpc.table.view.field.setPinned.mutate,
      invalidatesTags: (_, __, { tableId }) => [{ type: 'Table', id: tableId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useSetFilterMutation,
  useSetSortMutation,
  useSwitchDisplayTypeMutation,
  useCreateViewMutation,
  useUpdateViewNameMutation,
  useDuplicateViewMutation,
  useMoveViewMutation,
  useDeleteViewMutation,
  useSetFieldSortMutation,
  useResetFieldSortMutation,
  useSetShowSystemFieldsMutation,
  useSetPinnedFieldsMutation,
} = viewApi;

const calendarApi = viewApi.injectEndpoints({
  endpoints: (builder) => ({
    setCalendarField: builder.mutation({
      query: trpc.table.view.calendar.setField.mutate,
      invalidatesTags: (_, __, { tableId }) => [
        { type: 'Table', id: tableId },
        'Record',
      ],
    }),
  }),
});

export const { useSetCalendarFieldMutation } = calendarApi;

const kanbanApi = viewApi.injectEndpoints({
  endpoints: (builder) => ({
    setKanbanField: builder.mutation({
      query: trpc.table.view.kanban.setField.mutate,
      invalidatesTags: (_, __, { tableId }) => [
        { type: 'Table', id: tableId },
        'Record',
      ],
    }),
  }),
});

export const { useSetKanbanFieldMutation } = kanbanApi;

const treeViewApi = viewApi.injectEndpoints({
  endpoints: (builder) => ({
    setTreeField: builder.mutation({
      query: trpc.table.view.tree.setField.mutate,
      invalidatesTags: (_, __, { tableId }) => [
        { type: 'Table', id: tableId },
        'Record',
      ],
    }),
  }),
});

export const { useSetTreeFieldMutation } = treeViewApi;

const viewFieldApi = viewApi.injectEndpoints({
  endpoints: (builder) => ({
    setVisibility: builder.mutation({
      query: trpc.table.view.field.setVisibility.mutate,
      invalidatesTags: (_, __, { tableId }) => [{ type: 'Table', id: tableId }],
    }),
    moveField: builder.mutation({
      query: trpc.table.view.field.move.mutate,
      invalidatesTags: (_, __, { tableId }) => [{ type: 'Table', id: tableId }],
    }),
    setFieldWidth: builder.mutation({
      query: trpc.table.view.field.setWidth.mutate,
      invalidatesTags: (_, __, { tableId }) => [{ type: 'Table', id: tableId }],
    }),
  }),
});

export const {
  useSetVisibilityMutation,
  useMoveFieldMutation,
  useSetFieldWidthMutation,
} = viewFieldApi;
