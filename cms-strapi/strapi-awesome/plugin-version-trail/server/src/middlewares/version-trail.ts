import type { Context, Next } from 'koa';

import { checkContext } from '../utils/check-context';

export const versionTrailMiddleware = async (ctx: Context, next: Next) => {
  await next();

  try {
    const { uid, schema, isAdmin, change } = checkContext(ctx);

    if (!schema) {
      return;
    }

    const { pluginOptions } = schema;

    const isVerEnabled = pluginOptions?.versionTrail?.enabled;

    if (isVerEnabled) {
      /**
       * Intercept the body and take a snapshot of the change
       */
      const versionTrailService = strapi
        .plugin('version-trail')
        .service('versionTrailService');

      await versionTrailService.createVersionTrail(
        ctx,
        schema,
        uid,
        change,
        isAdmin,
      );
    }
  } catch (verMidErr) {
    console.error('version-trail: ', verMidErr);
  }
};

export default versionTrailMiddleware;
