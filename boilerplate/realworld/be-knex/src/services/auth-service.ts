import crypto from 'crypto';

import { userRepo } from '../repositories/user-repository';
import type {
  AuthorizedResponse,
  SanitizedUserData,
  UserCreateDto,
  UserLoginRequestDto,
  UserRegisterRequestDto,
} from '../types/user-type';
import { compare, hash } from '../utils/bcrypt';
import { ROLE } from '../utils/common';
import { env } from '../utils/env-helper';
import { ApiError } from '../utils/error-handler';
import { issueToken } from '../utils/jsonwebtoken';
import { sanitizeEntity } from '../utils/sanitize';

export const register = async (
  userDto: UserRegisterRequestDto,
): Promise<AuthorizedResponse> => {
  const _user: UserCreateDto = {
    ...userDto,
    role: ROLE.AUTHENTICATED, // set a default hard-coded role, for security purposes
    confirmed: true,
  };
  _user.password = await hash(userDto.password);

  // If email_verification is enabled set confirmation token and confirmed default to false
  if (env.boolean('user.email_confirmation', false, true)) {
    _user.confirmation_token = crypto.randomBytes(20).toString('hex');
    _user.confirmed = false;
  }

  const user = await userRepo.create(_user);
  const token = issueToken({
    id: user.id,
    role: user.role,
    email: user.email,
    username: user.username,
  });

  return {
    user: { token, ...(sanitizeEntity(user, 'users') as SanitizedUserData) },
  };
};

export const login = async (
  dto: UserLoginRequestDto,
): Promise<AuthorizedResponse> => {
  // Find user by username or email
  const user = await userRepo.findOneByIdOrEmail(dto.email);
  if (!user) throw ApiError.notFound('user email/id Not Found');

  // Check if password is valid
  const validPassword = await compare(dto.password, user.password);
  if (!validPassword)
    throw ApiError.badRequest({
      key: 'email',
      message: 'email or password invalid.',
      type: 'err.invalid',
      path: ['email', 'password'],
    });

  // Check if user is confirmed
  // if (!user.confirmed)
  //   throw ApiError.badRequest({
  //     key: 'confirmed',
  //     message: 'Please confirm your mail!',
  //     type: 'err.not-confirmed',
  //     path: ['confirmed'],
  //   });

  // Check if user is blocked
  if (user.blocked)
    throw ApiError.badRequest({
      key: 'blocked',
      message: 'You are blocked!',
      type: 'err.blocked',
      path: ['blocked'],
    });

  // Everything seems fine, generate token and return user data
  const token = issueToken({
    id: user.id,
    role: user.role,
    email: user.email,
    username: user.username,
  });

  return {
    user: { token, ...(sanitizeEntity(user, 'users') as SanitizedUserData) },
  };
  // return { token, user: sanitizeEntity(user, 'users') as SanitizedUserData };
};

export const authService = {
  register,
  login,
};
