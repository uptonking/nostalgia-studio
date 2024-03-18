import 'immer';
import 'reselect';

import fp from 'lodash/fp';
import { persistReducer } from 'redux-persist';
import sessionStorage from 'redux-persist/es/storage/session';

import { type PayloadAction } from '@reduxjs/toolkit';
import { createSelector, createSlice } from '@reduxjs/toolkit';

import { recordApi } from '../services';
import { type RootState } from '../store/reducer';

const { filter, keys, omit, pipe, some, T, propOr } = fp;

export interface RecordState {
  selectedRecordIds: Record<string, Record<string, boolean>>;
  total: Record<string, number>;
}

const initialState: RecordState = {
  selectedRecordIds: {},
  total: {},
};

export const recordSlice = createSlice({
  name: 'record',
  initialState,
  reducers: {
    setTableSelectedRecordIds: (
      state,
      action: PayloadAction<{ tableId: string; ids: Record<string, boolean> }>,
    ) => {
      state.selectedRecordIds[action.payload.tableId] = action.payload.ids;
    },
    resetTableSelectedRecordIds: (state, action: PayloadAction<string>) => {
      delete state.selectedRecordIds[action.payload];
    },
    resetSelectedRecordIds: (state) => {
      state.selectedRecordIds = initialState.selectedRecordIds;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        recordApi.endpoints.bulkDeleteRecords.matchFulfilled,
        (state, action) => {
          // @ts-expect-error fix-types
          const { ids, tableId } = action.meta.arg.originalArgs;
          state.selectedRecordIds = omit(ids, state.selectedRecordIds[tableId]);
        },
      )
      .addMatcher(
        recordApi.endpoints.bulkDuplicateRecord.matchFulfilled,
        (state, action) => {
          // @ts-expect-error fix-types
          delete state.selectedRecordIds[action.meta.arg.originalArgs.tableId];
        },
      );
  },
});

export const { setTableSelectedRecordIds, resetSelectedRecordIds } =
  recordSlice.actions;

export const recordReducer = persistReducer(
  {
    key: recordSlice.name,
    storage: sessionStorage,
  },
  recordSlice.reducer,
);

export const getSelectedRecordIds = (state: RootState) =>
  state.record.selectedRecordIds;

export const getTableSelectedRecordIds = createSelector(
  [getSelectedRecordIds, (_: RootState, tableId: string) => tableId],
  (ids, tableId) => ids[tableId] ?? {},
);

export const getTableSelectedRecordIdList = createSelector(
  getTableSelectedRecordIds,
  keys,
);

export const getTableSelectedRecordIdsCount = createSelector(
  getTableSelectedRecordIds,
  pipe(filter(T), propOr(0, 'length')),
);

export const getTableHasSelectedRecordIds = createSelector(
  getTableSelectedRecordIds,
  some(T),
);
