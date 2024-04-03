import {
  type TypedUseSelectorHook,
  useDispatch,
  useSelector,
} from 'react-redux';

import type { Dispatch } from '@reduxjs/toolkit';
import type { Store } from '@strapi/admin/strapi-admin';

import type { State } from '../store/reducers';

type RootState = ReturnType<Store['getState']> & {
  ['version-trail']: State;
};

const useTypedDispatch: () => Dispatch = useDispatch;
const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;

export { useTypedSelector, useTypedDispatch };
