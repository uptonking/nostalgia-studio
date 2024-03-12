import type { NextFunction, Request, Response } from 'express';

import { authService } from '../services/auth-service';
import { userService } from '../services/user-service';
import type {
  UserLoginRequestDto,
  UserRegisterRequestDto,
} from '../types/user-type';
import { ApiError } from '../utils/error-handler';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, username, password, name, image } = req.body.user;

    const maybeUser = await userService.findUserByIdOrEmailOrUsername({
      email,
      username,
    });
    console.log(';; maybeUser ', maybeUser);
    if (maybeUser?.id)
      return next(
        ApiError.badRequest(
          'username or email is already taken: ' + email + ' ' + username,
        ),
      );

    const dto: UserRegisterRequestDto = {
      email,
      username,
      password,
      name,
      image,
    };

    const data = await authService.register(dto);
    res.status(201).send(data);
  } catch (err) {
    return next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, password } = req.body.user;
    const dto: UserLoginRequestDto = { email, password };

    const data = await authService.login(dto);
    res.status(200).send(data);
  } catch (err) {
    return next(err);
  }
};

export const authController = {
  register,
  login,
};
