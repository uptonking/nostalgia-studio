import type { NextFunction, Request, Response } from 'express';

import { type AuthService, authService } from '../services/auth-service';
import type {
  UserLoginRequestDto,
  UserRegisterRequestDto,
} from '../types/user-type';

export class AuthController {
  constructor(private readonly _service: AuthService) {}

  public register = async (
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

      const data = await this._service.register(dto);
      res.status(201).send(data);
    } catch (err) {
      return next(err);
    }
  };

  public login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { identifier, password } = req.body;
      const dto: UserLoginRequestDto = { identifier, password };

      const data = await this._service.login(dto);
      res.status(200).send(data);
    } catch (err) {
      return next(err);
    }
  };
}

export const authController = new AuthController(authService);
