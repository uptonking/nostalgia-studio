import type { Core } from '@strapi/types';

import { userPermissionSchema } from './content-types/trail-user-permissions';
import { middlewares } from './middlewares';
import {
  usersPermModelName,
  versionTrailModelName,
} from './utils/plugin-getter-names';

export const register = ({ strapi }: { strapi: Core.Strapi }) => {
  const userPermContentType = strapi.contentType(usersPermModelName);

  if (userPermContentType) {
    // if user permissions plugin is installed, bind the trails directly to the user
    const trailContentType = strapi.contentType(versionTrailModelName);

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
