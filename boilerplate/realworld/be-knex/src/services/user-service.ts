import { usersRepo } from '../repositories/users-repository';
import type { SanitizedUserData, UserUpdateDto } from '../types/user-type';
import { sanitizeEntity } from '../utils/sanitize';

export const findUserById = async (id: number): Promise<SanitizedUserData> => {
  const user = await usersRepo.findById(id);
  return sanitizeEntity(user, 'users') as SanitizedUserData;
};

export const findUserByIdOrEmailOrUsername = async (options: {
  id?: string;
  email?: string;
  username?: string;
}): Promise<SanitizedUserData> => {
  const user = await usersRepo.findByIdOrEmailOrUsername(options);
  return sanitizeEntity(user, 'users') as SanitizedUserData;
};

export const findOneAndUpdate = async (
  id: number,
  dto: UserUpdateDto,
): Promise<SanitizedUserData> => {
  const user = await usersRepo.findOneAndUpdate(id, dto);
  return sanitizeEntity(user, 'users') as SanitizedUserData;
};

// export const userService = new UserService(userRepo);
export const userService = {
  findUserById,
  findUserByIdOrEmailOrUsername,
  findOneAndUpdate,
};
