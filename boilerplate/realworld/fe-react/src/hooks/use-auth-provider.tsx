import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import { isTokenValid, JWT_TOKEN_KEY } from '../api/api-utils';
import { getCurrentUser, logout } from '../api/auth-api';
import {
  type AuthAction,
  authReducer,
  type AuthState,
  initialState,
} from '../reducers/auth';
import { getLocalStorageValue } from '../utils/common';

type AuthContextProps = {
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
};

const AuthContext = createContext<AuthContextProps>({
  state: initialState,
  dispatch: () => initialState,
});

export function AuthProvider(props: React.PropsWithChildren<object>) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = getLocalStorageValue(JWT_TOKEN_KEY);
    if (!token) return;

    let ignore = false;

    async function fetchUser() {
      try {
        const payload = await getCurrentUser();
        const { token, ...user } = payload.data.user;
        if (!ignore) {
          dispatch({ type: 'LOAD_USER', user });
          dispatch({ type: 'LOGIN' });
        }
      } catch (error) {
        console.error('error at getCurrentUser ', error);
      }
    }

    if (!state.isAuthenticated) {
      fetchUser();
    }

    return () => {
      ignore = true;
    };
  }, [state.isAuthenticated]);

  const authData = useMemo(() => ({ state, dispatch }), [state]);

  return <AuthContext.Provider {...props} value={authData} />;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(`useAuth must be used within an AuthProvider`);
  }
  return context;
}
