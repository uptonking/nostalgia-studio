import type { NextFunction, Request, Response } from 'express';

import { authService } from '../services/auth-service';
import type {
  UserLoginRequestDto,
  UserRegisterRequestDto,
} from '../types/user-type';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email, username, password, name, image } = req.body.user;
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
