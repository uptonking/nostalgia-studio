import type { Strapi } from '@strapi/strapi';

import { getService } from './utils/common';

export const bootstrap = async ({ strapi }: { strapi: Strapi }) => {
  // const { actions } = strapi.plugin(pluginId).service("permissions");
  const { actions } = getService('permissions');
  const { decorator } = getService('entity-service-decorator');

  strapi.server.router.use(
    '/content-manager/collection-types/:model',
    (ctx, next) => {
      if (ctx.method === 'GET') {
        const { model } = ctx.params;
        const modelDef = strapi.getModel(model);
        const isVersioned =
          getService('content-types').isVersionedContentType(modelDef);
        console.log(';; modelDef ', isVersioned, modelDef.uid);

        if (!isVersioned) {
          return next();
        }

        ctx.request.query.filters = {
          $and: [{ is_visible_in_list_view: { $eq: true } }],
          ...ctx.request.query.filters,
        };
      }

      if (ctx.method === 'POST') {
        delete ctx.request.body.vuid;
        delete ctx.request.body.versionNumber;
        delete ctx.request.body.versions;
      }

      return next();
    },
  );

  // decorate Entity Service, v5 handled in the document service or via document service middlewares
  // @ts-expect-error fix-types
  strapi.entityService.decorate(decorator);

  // Actions
  await actions.registerVersionsActions();

  // Hooks & Models
  registerModelsHooks(strapi);
};

const registerModelsHooks = (strapi: Strapi) => {
  const versionedModelUIDs = Object.values(strapi.contentTypes)
    .filter((contentType) =>
      getService('content-types').isVersionedContentType(contentType),
    )
    .map((contentType) => contentType.uid);

  console.log(';; ver-types-uid ', versionedModelUIDs);

  if (versionedModelUIDs.length > 0) {
    strapi.db.lifecycles.subscribe({
      models: versionedModelUIDs,
      // / do nothing actually
      async beforeCreate(event) {
        await getService('lifecycles').beforeCreate(event, strapi);
      },
      async beforeUpdate(event) {
        await getService('lifecycles').beforeUpdate(event, strapi);
      },
      async afterUpdate(event) {
        await getService('lifecycles').afterUpdate(event, strapi);
      },
      async beforeDelete(event) {
        await getService('lifecycles').beforeDelete(event);
      },
    });
  }
};

export default bootstrap;
