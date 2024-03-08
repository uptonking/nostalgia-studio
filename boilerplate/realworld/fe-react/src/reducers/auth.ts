import type { UserType } from '../types';

export type AuthAction =
  | { type: 'LOGIN' }
  | { type: 'LOGOUT' }
  | {
      // used to update user data in state, useful for register and login
      type: 'LOAD_USER';
      user: UserType;
    };

export interface AuthState {
  isAuthenticated: boolean;
  user: UserType | null;
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
