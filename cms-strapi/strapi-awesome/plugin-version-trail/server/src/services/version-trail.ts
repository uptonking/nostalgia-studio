import type { Core } from '@strapi/types';

import { prepareTrailFromSchema } from '../utils/prepare-trail-from-schema';
import { entityName } from '../utils/plugin-entity-name';

export const versionTrailService = ({ strapi }: { strapi: Core.Strapi }) => ({
  async createVersionTrail(context, schema, uid, change, isAdmin) {
    const body = isAdmin ? context.request.body : context.request.body.data;
    const user = context.state.user;
    const userId = user?.id;
    const resBody = isAdmin
      ? context.response.body
      : context.response.body.data;

    const id = resBody.id || resBody?.data?.id;

    if (!id) {
      // Early return, if we don't have a record ID for existing or newly created record the trail is useless
      return;
    }

    const { trail } = prepareTrailFromSchema(body, schema);

    /**
     * Get all trails belonging to this record so we can increment a version number
     */
    const trails = await strapi.entityService.findMany(entityName, {
      fields: ['version'],
      filters: { contentType: uid, recordId: id },
      // @ts-expect-error fix-types
      sort: { version: 'DESC' },
    });

    const version = trails[0] ? trails[0].version + 1 : 1;

    const newTrail = {
      admin_user: {
        connect: isAdmin && userId ? [{ id: userId }] : [],
        disconnect: [],
      },
      change,
      content: trail,
      contentType: uid,
      recordId: id,
      users_permissions_user: {
        connect: !isAdmin && userId ? [{ id: userId }] : [],
        disconnect: [],
      },
      version,
    };

    /**
     * Save it
     */
    try {
      const entity = await strapi.entityService.create(entityName, {
        data: newTrail,
      });

      return entity;
    } catch (createErr) {
      console.error('version-trail: ', createErr);
    }

    return trail;
  },
});
