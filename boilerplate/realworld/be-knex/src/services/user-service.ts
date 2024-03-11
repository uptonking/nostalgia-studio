import { userRepo } from '../repositories/user-repository';
import type { SanitizedUserData, UserUpdateDto } from '../types/user-type';
import { sanitizeEntity } from '../utils/sanitize';

export const findOne = async (id: number): Promise<SanitizedUserData> => {
  const user = await userRepo.findOne(id);
  return sanitizeEntity(user, 'users') as SanitizedUserData;
};

export const findOneAndUpdate = async (
  id: number,
  dto: UserUpdateDto,
): Promise<SanitizedUserData> => {
  const user = await userRepo.findOneAndUpdate(id, dto);
  return sanitizeEntity(user, 'users') as SanitizedUserData;
};

// export const userService = new UserService(userRepo);
export const userService = {
  findOne,
  findOneAndUpdate,
};
