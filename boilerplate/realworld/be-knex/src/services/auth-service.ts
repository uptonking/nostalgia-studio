import crypto from 'crypto';

import {
  userRepository,
  type UserRepository,
} from '../repositories/user-repository';
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

export class AuthService {
  constructor(private readonly _repository: UserRepository) {}

  public register = async (
    dto: UserRegisterRequestDto,
  ): Promise<AuthorizedResponse> => {
    const body: UserCreateDto = {
      ...dto,
      role: ROLE.AUTHENTICATED, // set a default hard-coded role, for security purposes
      confirmed: true,
    };
    body.password = await hash(dto.password);

    // If email_verification is enabled set confirmation token and confirmed default to false
    if (env.boolean('user.email_confirmation', false, true)) {
      body.confirmation_token = crypto.randomBytes(20).toString('hex');
      body.confirmed = false;
    }

    const user = await this._repository.create(body);
    const token = issueToken({
      id: user.user_id,
      role: user.role,
    });

    return { token, user: sanitizeEntity(user, 'users') as SanitizedUserData };
  };

  public login = async (
    dto: UserLoginRequestDto,
  ): Promise<AuthorizedResponse> => {
    // Find user by username or email
    const user = await this._repository.findOneWithIdentifier(dto.identifier);

    // Check if the user exists.
    if (!user)
      throw ApiError.badRequest({
        key: 'identifier',
        message: 'User not found!',
        type: 'err.not-found',
        path: ['username', 'email'],
      });

    // Check if password is valid
    const validPassword = await compare(dto.password, user.password);
    if (!validPassword)
      throw ApiError.badRequest({
        key: 'identifier',
        message: 'Identifier or password invalid.',
        type: 'err.invalid',
        path: ['identifier', 'password'],
      });

    // Check if user is confirmed
    if (!user.confirmed)
      throw ApiError.badRequest({
        key: 'confirmed',
        message: 'Please confirm your mail!',
        type: 'err.not-confirmed',
        path: ['confirmed'],
      });

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
      id: user.user_id,
      role: user.role,
    });

    return { token, user: sanitizeEntity(user, 'users') as SanitizedUserData };
  };
}

export const authService = new AuthService(userRepository);
