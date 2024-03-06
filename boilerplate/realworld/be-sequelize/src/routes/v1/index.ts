import { Router } from 'express';

import { articleRouter } from './article-routes';
import { authRouter } from './auth-routes';
import { docsRouter } from './docs-routes';
import { tagRouter } from './tag-routes';
import { userRouter, userRouterV1, usersRouter } from './user-routes';

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
