import { type IQueryRecordSchema } from '@datalking/pivot-core';
import {
  type IGetForeignRecordsQuery,
  type IGetParentAvailableRecordQuery,
  type IGetRecordOutput,
  type IGetRecordQuery,
  type IGetRecordsOutput,
  type IGetRecordsQuery,
  type IGetRecordsTreeOutput,
  type IGetRecordsTreeQuery,
  type IGetTreeAvailableRecordsQuery,
  type IUpdateRecordCommandInput,
} from '@datalking/pivot-cqrs';
import { type EntityState } from '@reduxjs/toolkit';
import { createEntityAdapter, createSelector } from '@reduxjs/toolkit';

import { type RootState } from '../store/reducer';
import { trpc } from '../trpc';
import { api } from './api';

const recordAdapter: ReturnType<
  typeof createEntityAdapter<IQueryRecordSchema>
> = createEntityAdapter<IQueryRecordSchema>();
const initialState = recordAdapter.getInitialState();

type QueryRecordsEntity = EntityState<IQueryRecordSchema> & { total: number };

const providesTags = (result: QueryRecordsEntity | undefined) => [
  'Record' as const,
  ...(result?.ids?.map((id) => ({ type: 'Record' as const, id })) ?? []),
];

const transformResponse = (result: IGetRecordsOutput) => {
  const entities = recordAdapter.setAll(initialState, result.records);
  return { ...entities, total: result.total };
};

export const recordApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRecords: builder.query<QueryRecordsEntity, IGetRecordsQuery>({
      query: trpc.record.list.query,
      providesTags,
      transformResponse,
    }),
    getForeignRecords: builder.query<
      QueryRecordsEntity,
      IGetForeignRecordsQuery
    >({
      query: trpc.record.foreign.query,
      providesTags,
      transformResponse,
    }),
    getRecord: builder.query<IGetRecordOutput, IGetRecordQuery>({
      query: trpc.record.get.query,
      providesTags: (_, __, { id }) => [{ type: 'Record', id }],
    }),
    listTree: builder.query<IGetRecordsTreeOutput, IGetRecordsTreeQuery>({
      query: trpc.record.tree.list.query,
      providesTags: ['TreeRecord'],
    }),
    treeAvailable: builder.query<
      QueryRecordsEntity,
      IGetTreeAvailableRecordsQuery
    >({
      query: trpc.record.tree.available.query,
      providesTags,
      transformResponse,
    }),
    parentAvailable: builder.query<
      QueryRecordsEntity,
      IGetParentAvailableRecordQuery
    >({
      query: trpc.record.parent.available.query,
      providesTags,
      transformResponse,
    }),
    createRecord: builder.mutation({
      query: trpc.record.create.mutate,
      invalidatesTags: ['Record', 'TreeRecord'],
    }),
    updateRecord: builder.mutation<void, IUpdateRecordCommandInput>({
      query: trpc.record.update.mutate,
      invalidatesTags: ['Record', 'TreeRecord'],
    }),
    duplicateRecord: builder.mutation({
      query: trpc.record.duplicate.mutate,
      invalidatesTags: ['Record'],
    }),
    bulkDuplicateRecord: builder.mutation({
      query: trpc.record.bulkDuplicate.mutate,
      invalidatesTags: ['Record'],
    }),
    deleteRecord: builder.mutation({
      query: trpc.record.delete.mutate,
      invalidatesTags: ['Record'],
      // @ts-expect-error fix-types
      onQueryStarted({ id, tableId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          recordApi.util.updateQueryData('getRecords', { tableId }, (draft) => {
            delete draft.entities[id];
          }),
        );
        queryFulfilled.catch(patchResult.undo);
      },
    }),
    bulkDeleteRecords: builder.mutation({
      query: trpc.record.bulkDelete.mutate,
      // @ts-expect-error fix-types
      onQueryStarted({ ids, tableId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          recordApi.util.updateQueryData('getRecords', { tableId }, (draft) => {
            for (const id of ids) {
              delete draft.entities[id];
            }
          }),
        );
        queryFulfilled.catch(patchResult.undo);
      },
    }),
  }),
});

export const {
  useGetRecordsQuery,
  useGetForeignRecordsQuery,
  useGetRecordQuery,
  useLazyGetRecordsQuery,
  useListTreeQuery,
  useParentAvailableQuery,
  useLazyParentAvailableQuery,
  useTreeAvailableQuery,
  useLazyTreeAvailableQuery,
  useCreateRecordMutation,
  useUpdateRecordMutation,
  useDuplicateRecordMutation,
  useBulkDuplicateRecordMutation,
  useDeleteRecordMutation,
  useBulkDeleteRecordsMutation,
} = recordApi;

const getCurrentTableRecords = (state: RootState) =>
  recordApi.endpoints.getRecords.select({
    tableId: state.table.currentTableId,
    viewId: state.table.currentViewId,
  })(state);

export const getCurrentTableRecordsTotal = createSelector(
  getCurrentTableRecords,
  (result) => result.data?.total ?? 0,
);

export const getIsLoadedCurrentRecords = createSelector(
  getCurrentTableRecords,
  (result) => result.isSuccess,
);
