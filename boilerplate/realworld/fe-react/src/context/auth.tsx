import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

import {
  isTokenValid,
  isTokenValidForTest,
  JWT_TOKEN_KEY,
} from '../api/api-utils';
import { logout } from '../api/auth-api';
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
    // console.log('==AuthProvider-token, ', token);
    if (!token) return;

    // if (isTokenValidForTest(token)) {
    //   // setToken(token);
    //   dispatch({ type: 'LOGIN' });
    // }

    if (isTokenValid(token)) {
      // setToken(token);
      dispatch({ type: 'LOGIN' });
    } else {
      dispatch({ type: 'LOGOUT' });
      logout();
    }
  }, []);

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
