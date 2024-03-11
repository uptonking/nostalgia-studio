import type { ROLE } from '../utils/common';

export interface UserCreateDto {
  username: string;
  email: string;
  password: string;
  role: ROLE;
  name?: string;
  image?: string;
  confirmed: boolean;
  confirmation_token?: string;
}

export interface UserUpdateDto {
  name?: string;
  image?: string;
}

export type UserRegisterRequestDto = Omit<
  UserCreateDto,
  'role' | 'confirmed' | 'confirmation_token'
>;

export interface UserLoginRequestDto {
  email: string;
  password: string;
}

export interface UserData {
  id: number;
  username: string;
  password: string;
  email: string;
  name?: string;
  role: string;
  image?: string;
  confirmed: boolean;
  blocked?: boolean;
  confirmation_token?: string;
  reset_password_token?: string;
  created_at: Date;
  updated_at: Date;
}

export type SanitizedUserData = Omit<
  UserData,
  'password' | 'confirmation_token' | 'reset_password_token'
>;

export interface AuthorizedResponse {
  user: SanitizedUserData & { token: string };
}
