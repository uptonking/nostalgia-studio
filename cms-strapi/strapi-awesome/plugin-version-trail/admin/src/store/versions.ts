import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface VersionsState {
  versionsList: {
    pageSize: number;
  };
  isLoading: boolean;
}

const initialState: VersionsState = {
  versionsList: {
    pageSize: 3,
  },
  isLoading: false,
};

const versionsSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setPageSize(
      state,
      action: PayloadAction<{
        versionsList: VersionsState['versionsList'];
      }>,
    ) {
      const { versionsList } = action.payload;
      state.versionsList.pageSize = versionsList.pageSize;
    },
  },
});

const { actions, reducer } = versionsSlice;
const { setPageSize } = actions;

export { reducer, setPageSize };
