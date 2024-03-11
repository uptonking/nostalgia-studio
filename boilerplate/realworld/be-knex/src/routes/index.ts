import { Router } from 'express';

import { articleRouter } from './article-route';
import { authRouter } from './auth-route';
import { userRouter, usersRouter } from './user-route';
import { tagRouter } from './tag-route';

const appRouter = Router();

// appRouter.use('/v1/users', authRouter);
// appRouter.use('/users', userRouter);

const appRoutes = [
  {
    path: '/articles',
    router: articleRouter,
  },
  {
    path: '/tags',
    router: tagRouter,
  },
  {
    path: '/users',
    router: usersRouter,
  },
  {
    path: '/user',
    router: userRouter,
  },
  // {
  //   path: '/profiles',
  //   router: profileRouter,
  // },
  {
    path: '/v1/auth',
    router: authRouter,
  },
];

appRoutes.forEach((route) => {
  appRouter.use(route.path, route.router);
});

export { appRouter };
