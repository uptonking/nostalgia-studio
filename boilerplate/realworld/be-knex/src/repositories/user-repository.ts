import { db } from '../db/connection';
import type {
  UserCreateDto,
  UserData,
  UserUpdateDto,
} from '../types/user-type';

export const create = async (dto: UserCreateDto): Promise<UserData> => {
  const [data] = await db('users').insert(dto).returning('*');
  return data as UserData;
};

export const findOne = async (userId: number): Promise<UserData> => {
  const [data] = await db('users').where({ id: userId });
  return data as UserData;
};

export const findOneByIdOrEmail = async (
  idOrEmail: string,
): Promise<UserData> => {
  const [data] = await db('users')
    .where('id', idOrEmail)
    .orWhere('email', idOrEmail)
    .orWhere('username', idOrEmail);
  return data as UserData;
};

export const findOneAndUpdate = async (
  user_id: number,
  body: UserUpdateDto,
): Promise<UserData> => {
  const [data] = await db('users')
    .where({ user_id })
    .update(body)
    .returning('*');
  return data as UserData;
};

export const userRepo = {
  create,
  findOne,
  findOneByIdOrEmail,
  findOneAndUpdate,
};
