import { getLatestRawQuery, getService } from '../../../utils';

// Disable versioning on CT -> Delete all older versions of entities
export default async ({ oldContentTypes, contentTypes }) => {
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

    if (
      isVersionedContentType(oldContentType) &&
      !isVersionedContentType(contentType)
    ) {
      // @ts-expect-error fix-types
      const model = strapi.getModel(uid);

      // @ts-expect-error fix-types
      const latestQuery = getLatestRawQuery(model);
      const selectedLastVersions = await strapi.db.connection.raw(latestQuery);

      const idsToKeep = selectedLastVersions?.rows?.map((r) => r.id) || [];

      await strapi.db.query(uid).deleteMany({
        where: {
          id: {
            $notIn: idsToKeep,
          },
        },
      });
    }
  }
};
