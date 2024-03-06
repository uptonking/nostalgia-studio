import { Router } from 'express';

import { loginUser, registerUser } from '../../controllers/auth-controller';
import { getUserData, updateUser } from '../../controllers/user-controller';
import { requireUser, validateRequest } from '../../middleware';
import {
  loginSchema,
  registerSchema,
  updateSchema,
} from '../../validation/user-schema';

export const usersRouter = Router();
// register; returns a User
usersRouter.post('/', validateRequest(registerSchema), registerUser);
// login; returns a User
usersRouter.post('/login', validateRequest(loginSchema), loginUser);

export const userRouter = Router();
// Get Current User; returns a User that's the current user
userRouter.get('/', requireUser, getUserData);
// Update User; returns the User
userRouter.put('/', requireUser, validateRequest(updateSchema), updateUser);

export const userRouterV1 = Router();
userRouterV1.get('/', requireUser, getUserData);
userRouterV1.patch('/', requireUser, validateRequest(updateSchema), updateUser);

export default userRouterV1;

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User get or update. For User create, see /auth/register
 */

/**
 * @swagger
 * /v1/user:
 *   get:
 *     summary: Get user information
 *     description: Logged in users can fetch only their own user information.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: OK
 *
 *   patch:
 *     summary: Update user
 *     description: Logged in users can only update their own information.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *             example:
 *               name: fake name
 *     responses:
 *       "200":
 *         description: OK
 *
 */
