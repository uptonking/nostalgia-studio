import { v4 as uuid } from 'uuid';

import { getService } from '../../../utils/common';

/**
 * if versioning is enabled, set default version and vuid
 */
export const enableContentType = async ({ oldContentTypes, contentTypes }) => {
  const { isVersionedContentType } = getService('content-types');

  if (!oldContentTypes) {
    return;
  }

  for (const uid in contentTypes) {
    if (!oldContentTypes[uid]) {
      continue;
    }

    const oldContentType = oldContentTypes[uid];
    const contentType = contentTypes[uid];
    const vuids = {};

    if (
      !isVersionedContentType(oldContentType) &&
      isVersionedContentType(contentType)
    ) {
      const entities = await strapi.db.query(uid).findMany({
        populate: {
          localizations: true,
        },
      });

      for (const entity of entities) {
        const allWithVuid = Object.values(vuids).flat();
        const localizationsIds =
          entity.localizations?.map(({ id }) => id) ?? [];

        if (!entity.vuid && !allWithVuid.includes(entity.id)) {
          const localeVuid = uuid();
          vuids[localeVuid] = [entity.id, ...localizationsIds];

          await strapi.db.query(uid).updateMany({
            where: { id: { $in: vuids[localeVuid] } },
            data: {
              versionNumber: 1,
              vuid: localeVuid,
              isVisibleInListView: true,
            },
          });
        }
      }
    }
  }
};

export default enableContentType;
