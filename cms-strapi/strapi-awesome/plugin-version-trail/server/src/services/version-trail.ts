import type { Core } from '@strapi/types';

import { versionTrailModelName } from '../utils/plugin-getter-names';
import { prepareTrailFromSchema } from '../utils/prepare-trail-from-schema';

export const versionTrailService = ({ strapi }: { strapi: Core.Strapi }) => ({
  async createVersionTrail(context, schema, uid, change, isAdmin) {
    const body = isAdmin ? context.request.body : context.request.body.data;
    const user = context.state.user;
    const userId = user?.id;
    const resBody = isAdmin
      ? context.response.body
      : context.response.body.data;

    console.log(';; createTrail ', context.request.body, context.response.body);
    const id = resBody.id || resBody?.data?.id;

    if (!id) {
      // Early return, if we don't have a record ID for existing or newly created record the trail is useless
      return;
    }

    /**
     * Get all trails of this record so we can increment a version number
     */
    const trails = await strapi.entityService.findMany(versionTrailModelName, {
      fields: ['version'],
      filters: { contentType: uid, recordId: id },
      // @ts-expect-error fix-types
      sort: { version: 'DESC' },
    });
    const version = trails[0] ? trails[0].version + 1 : 1;

    const { trail } = prepareTrailFromSchema(body, schema);
    console.log(';; trail-existing ', uid, trail, trails);

    const newTrail = {
      admin_user: {
        connect: isAdmin && userId ? [{ id: userId }] : [],
        disconnect: [],
      },
      change,
      content: trail,
      contentType: uid,
      recordId: id,
      documentId: resBody.documentId || resBody?.data?.documentId,
      users_permissions_user: {
        connect: !isAdmin && userId ? [{ id: userId }] : [],
        disconnect: [],
      },
      version,
    };

    try {
      const entity = await strapi.entityService.create(versionTrailModelName, {
        data: newTrail,
      });

      return entity;
    } catch (createErr) {
      console.error('create-ver-trail: ', createErr);
    }

    return trail;
  },
});
