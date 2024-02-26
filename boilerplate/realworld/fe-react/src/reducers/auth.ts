import type { IUser } from '../types';

export type AuthAction =
  | { type: 'LOGIN' }
  | { type: 'LOGOUT' }
  | {
      type: 'LOAD_USER';
      user: IUser;
    };

export interface AuthState {
  isAuthenticated: boolean;
  user: IUser | null;
}

export const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN': {
      return { ...state, isAuthenticated: true };
    }
    case 'LOAD_USER': {
      return { ...state, user: action.user };
    }
    case 'LOGOUT': {
      return { isAuthenticated: false, user: null };
    }
    default:
      return state;
  }
}
