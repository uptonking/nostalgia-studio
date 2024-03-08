import { Router } from 'express';

import { articleRouter } from './article-route';
import { authRouter } from './auth-route';
import { docsRouter } from './docs-route';
import { tagRouter } from './tag-route';
import { userRouter, userRouterV1, usersRouter } from './user-route';

export const appRouter = Router();

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
  {
    path: '/v1/auth',
    router: authRouter,
  },
  {
    path: '/v1/user',
    router: userRouterV1,
  },
  {
    path: '/docs',
    router: docsRouter,
  },
];

appRoutes.forEach((route) => {
  appRouter.use(route.path, route.router);
});

export default appRouter;
