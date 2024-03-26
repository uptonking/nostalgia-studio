import type { Strapi } from '@strapi/strapi';

import { registerVersionsActions } from './actions';

export const permissions = ({ strapi }: { strapi: Strapi }) => ({
  actions: { registerVersionsActions },
});

export default permissions;
