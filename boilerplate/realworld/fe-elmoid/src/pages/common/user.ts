import {
  ReadFromStorage,
  RemoveFromStorage,
  WriteToStorage,
} from '../../utils/hyperapp-fx';
import { Redirect } from '../../utils/router';
import { HOME } from '../links';

const SESSION = 'session';

// Actions & Effects
const SetUser = (state, { value }) =>
  value ? { ...state, user: value } : state;

const SaveUser = (user) => WriteToStorage({ key: SESSION, value: user });

export const ReadUser = ReadFromStorage({ key: SESSION, action: SetUser });

export const UserSuccess = (state, { user }) => [
  { ...state, user },
  [SaveUser(user), Redirect({ path: HOME })],
];

export const Logout = (state) => [
  { ...state, user: {} },
  [RemoveFromStorage({ key: SESSION }), Redirect({ path: HOME })],
];
