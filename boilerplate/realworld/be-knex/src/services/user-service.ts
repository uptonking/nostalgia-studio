import {
  userRepository,
  type UserRepository,
} from '../repositories/user-repository';
import type { SanitizedUserData, UserUpdateDto } from '../types/user-type';
import { sanitizeEntity } from '../utils/sanitize';

export class UserService {
  constructor(private readonly _repository: UserRepository) {}

  public findOne = async (id: number): Promise<SanitizedUserData> => {
    const user = await this._repository.findOne(id);
    return sanitizeEntity(user, 'users') as SanitizedUserData;
  };

  public findOneAndUpdate = async (
    id: number,
    dto: UserUpdateDto,
  ): Promise<SanitizedUserData> => {
    const user = await this._repository.findOneAndUpdate(id, dto);
    return sanitizeEntity(user, 'users') as SanitizedUserData;
  };
}

export const userService = new UserService(userRepository);
