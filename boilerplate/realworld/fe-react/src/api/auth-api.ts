import type { UserType } from '../types';
import { setLocalStorage } from '../utils/common';
import API, { JWT_TOKEN_KEY } from './api-utils';

type User = {
  user: UserType & { token: string };
};

function handleUserResponse({ user: { token, ...user } }: User) {
  setLocalStorage(JWT_TOKEN_KEY, token);
  // setToken(token);
  return user;
}

export function getCurrentUser() {
  return API.get<User>('/user');
}

export async function login(email: string, password: string) {
  const _user = await API.post<User>('/users/login', {
    user: { email, password },
  });
  return handleUserResponse(_user.data);

  // return mockApi
  //   .loginByEmail({
  //     user: { email, password },
  //   })
  //   .then((resUser) => {
  //     console.log(`==logging user, `, JSON.stringify(resUser));
  //     return handleUserResponse((resUser as any).data);
  //   });
}

export async function register(user: {
  username: string;
  email: string;
  password: string;
}) {
  const _user = await API.post<User>('/users', { user });
  return handleUserResponse(_user.data);

  // return mockApi.createUser({ user }).then((resUser) => {
  //   console.log(`==registered user, `, JSON.stringify(resUser));
  //   return handleUserResponse((resUser as any).data);
  // });
}

export function updateUser(user: UserType & Partial<{ password: string }>) {
  return API.put<User>('/user', { user });

  // return mockApi.updateUser({ user });
}

export function logout() {
  localStorage.removeItem(JWT_TOKEN_KEY);
  // setToken(null);
}
