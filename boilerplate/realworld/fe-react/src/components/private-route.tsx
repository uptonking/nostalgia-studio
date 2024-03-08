import * as React from 'react';

import { Navigate, type RouteProps } from 'react-router-dom';

import { useAuth } from '../hooks/use-auth-provider';

export function PrivateRoute({ children }: RouteProps) {
  const {
    state: { user },
  } = useAuth();

  return Boolean(user) ? children : <Navigate to='/login' />;
}

export default PrivateRoute;
