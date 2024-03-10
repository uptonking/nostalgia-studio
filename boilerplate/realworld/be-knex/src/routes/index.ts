import { Router } from 'express';

import { authRouter } from './auth-route';
import { userRouter } from './user-route';

const appRouter = Router();

appRouter.use('/users', authRouter);
appRouter.use('/users1', userRouter);

export { appRouter };
