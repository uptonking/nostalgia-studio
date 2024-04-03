import { combineReducers } from '@reduxjs/toolkit';

import { reducer as appReducer } from './versions';

export const reducer = combineReducers({
  app: appReducer,
});

export type State = ReturnType<typeof reducer>;
