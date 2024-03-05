import { Router } from 'express';

import { authRouter } from './auth-routes';
import { docsRouter } from './docs-routes';
import { userRouter } from './user-routes';

export const appRouter = Router();

const appRoutes = [
  {
    path: '/auth',
    router: authRouter,
  },
  {
    path: '/user',
    router: userRouter,
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
