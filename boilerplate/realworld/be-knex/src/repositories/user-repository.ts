import { database as _db } from '../db/connection';
import type {
  UserCreateDto,
  UserData,
  UserUpdateDto,
} from '../types/user-type';

export class UserRepository {
  public create = async (dto: UserCreateDto): Promise<UserData> => {
    const [data] = await _db('users').insert(dto).returning('*');
    return data as UserData;
  };

  public findOne = async (user_id: number): Promise<UserData> => {
    const [data] = await _db('users').where({ user_id });
    return data as UserData;
  };

  public findOneWithIdentifier = async (
    identifier: string,
  ): Promise<UserData> => {
    const [data] = await _db('users')
      .where('username', identifier)
      .orWhere('email', identifier);
    return data as UserData;
  };

  public findOneAndUpdate = async (
    user_id: number,
    body: UserUpdateDto,
  ): Promise<UserData> => {
    const [data] = await _db('users')
      .where({ user_id })
      .update(body)
      .returning('*');
    return data as UserData;
  };
}

export const userRepository = new UserRepository();
