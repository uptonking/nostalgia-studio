import _ from 'lodash';

import type { Strapi } from '@strapi/strapi';

import { relationUpdateMiddleware } from './middlewares';
import { disableContentType } from './migrations/content-type/disable';
import { enableContentType } from './migrations/content-type/enable';
import { getService } from './utils/common';

export const register = ({ strapi }: { strapi: Strapi }) => {
  extendVersionedContentTypes(strapi);
  addStrapiVersioningMiddleware(strapi);
  addContentTypeSyncHooks(strapi);
};

export default register;

/**
 * Adds version fields to versioned content types
 */
const extendVersionedContentTypes = (strapi: Strapi) => {
  const contentTypeService = getService('content-types');

  Object.values(strapi.contentTypes).forEach((contentType) => {
    if (contentTypeService.isVersionedContentType(contentType)) {
      const { attributes } = contentType;

      // versions is a standalone foreign table
      _.set(attributes, 'versions', {
        writable: true,
        private: false,
        configurable: false,
        visible: false,
        type: 'relation',
        relation: 'manyToMany',
        target: contentType.uid,
      });

      _.set(attributes, 'vuid', {
        writable: true,
        private: false,
        configurable: false,
        visible: false,
        type: 'string',
      });

      _.set(attributes, 'versionNumber', {
        writable: true,
        private: false,
        configurable: false,
        visible: false,
        type: 'integer',
        default: 1,
      });

      _.set(attributes, 'versionComment', {
        writable: true,
        private: false,
        configurable: false,
        visible: false,
        type: 'string',
      });

      _.set(attributes, 'isVisibleInListView', {
        writable: true,
        private: false,
        configurable: false,
        visible: false,
        type: 'boolean',
        default: true,
      });
    }
  });
};

/**
 * Adds middlewares on CM publish routes
 */
const addStrapiVersioningMiddleware = (strapi: Strapi) => {
  strapi.server.router.use(
    '/content-manager/collection-types/:model/:id/actions/publish',
    (ctx, next) => {
      if (ctx.method === 'POST') {
        return relationUpdateMiddleware(ctx, next);
      }

      return next();
    },
  );
};

/**
 * Adds hooks to migration content types versions on enable/disable of versioning
 */
const addContentTypeSyncHooks = (strapi: Strapi) => {
  strapi.hook('strapi::content-types.beforeSync').register(disableContentType);
  strapi.hook('strapi::content-types.afterSync').register(enableContentType);
};
