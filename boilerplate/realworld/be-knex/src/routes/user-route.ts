import { Router } from 'express';

import { authController } from '../controllers/auth-controller';
import { userController } from '../controllers/user-controller';
import { authorizeUser } from '../middlewares/auth';
import {
  loginValidator,
  registerValidator,
} from '../middlewares/validators/auth-validator';
import { updateValidator } from '../middlewares/validators/user-validator';
import { ROLE } from '../utils/common';

/** 🔐 register/login */
export const usersRouter = Router();

usersRouter.post('/login', [loginValidator], authController.login);
// register
usersRouter.post('/', [registerValidator], authController.register);

/** 👤 get/update user */
export const userRouter = Router();

// returns user's object. Expects JWT token
userRouter.get('/', [authorizeUser()], userController.me);

// update user info
userRouter.put(
  '/',
  [authorizeUser([ROLE.ADMIN, ROLE.AUTHENTICATED]), updateValidator],
  userController.update,
);
