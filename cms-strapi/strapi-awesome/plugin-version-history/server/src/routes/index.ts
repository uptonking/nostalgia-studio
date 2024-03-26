import { adminRoutes } from './admin';
import { clientRoutes } from './client';

// configure both admin and Content API routes if you need different policies
export const routes = {
  admin: {
    type: 'admin',
    routes: adminRoutes,
  },
  'content-api': {
    type: 'content-api',
    routes: clientRoutes,
  },
};

export default routes;
