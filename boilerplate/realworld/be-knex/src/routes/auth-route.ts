import { Router } from 'express';

import { authController } from '../controllers/auth-controller';
import {
  loginValidator,
  registerValidator,
} from '../middlewares/validators/auth-validator';

export const authRouter = Router();

authRouter.post('/login', [loginValidator], authController.login);

// register
authRouter.post('/', [registerValidator], authController.register);
