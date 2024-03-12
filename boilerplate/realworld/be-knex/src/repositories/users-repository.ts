import { db } from '../db/connection';
import type {
  UserCreateDto,
  UserData,
  UserUpdateDto,
} from '../types/user-type';

export const insertOne = async (dto: UserCreateDto): Promise<UserData> => {
  const [data] = await db('users').insert(dto).returning('*');
  return data as UserData;
};

export const findById = async (userId: number): Promise<UserData> => {
  const [data] = await db('users').where({ id: userId });
  return data as UserData;
};

export const findByIdOrEmailOrUsername = async (options: {
  id?: string;
  email?: string;
  username?: string;
}): Promise<UserData | null> => {
  const { id, email, username } = options;
  console.log(';; options ', options);
  if (!id && !email && !username) return null;
  console.log(';; options-2 ');

  const query = db('users').first();

  if (id) {
    query.where('id', id);
  }
  if (email) {
    query.where('email', email);
  }
  if (username) {
    query.orWhere('username', username);
  }

  const data = await query;
  console.log(';; findUser ', data);

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

export const usersRepo = {
  insertOne,
  findById,
  findByIdOrEmailOrUsername,
  findOneAndUpdate,
};
