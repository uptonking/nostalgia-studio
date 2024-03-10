import { Router } from 'express';

import { userController } from '../controllers/user-controller';
import { authorize } from '../middlewares/auth';
import { updateValidator } from '../middlewares/validators/user-validator';
import { ROLE } from '../utils/common';

export const userRouter = Router();

/**
 * @route   /users/me
 * @description Returns user's object. Expects JWT token
 */
userRouter.get(
  '/me',
  [authorize([ROLE.ADMIN, ROLE.AUTHENTICATED])],
  userController.me,
);

/**
 * @route   /users
 * @description Updates logged-in user.
 */
userRouter.put(
  '/',
  [authorize([ROLE.ADMIN, ROLE.AUTHENTICATED]), updateValidator],
  userController.update,
);
