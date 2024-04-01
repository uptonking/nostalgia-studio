import type { Core } from '@strapi/types';

import { userPermissionSchema } from './content-types/trail-user-permissions';
import { middlewares } from './middlewares';
import { entityName } from './utils/plugin-entity-name';

export const register = ({ strapi }: { strapi: Core.Strapi }) => {
  const userPermissionsContentType = strapi.contentType(
    'plugin::users-permissions.user',
  );

  if (userPermissionsContentType) {
    // if the user permissions plugin is installed, bind the trails directly to the user
    const trailContentType = strapi.contentType(entityName);

    // @ts-expect-error fix-types
    trailContentType.attributes = {
      // Spread previous defined attributes
      ...trailContentType.attributes,
      // Add new attribute
      ...userPermissionSchema,
    };
  }

  strapi.server.use(middlewares.versionTrailMiddleware);
};

export default register;
