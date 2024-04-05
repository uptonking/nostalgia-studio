import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface VersionsState {
  versionsList: {
    pageSize: number;
  };
  previewVersion: {
    verNumber: number;
  };
  isLoading: boolean;
}

const initialState: VersionsState = {
  versionsList: {
    pageSize: 3,
  },
  previewVersion: {
    verNumber: -1,
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
    setPreviewVersion(state, action: PayloadAction<number>) {
      state.previewVersion.verNumber = action.payload;
    },
  },
});

const { actions, reducer } = versionsSlice;
const { setPageSize, setPreviewVersion } = actions;

export { reducer, setPageSize, setPreviewVersion };
