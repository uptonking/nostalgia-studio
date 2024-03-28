import _ from 'lodash';
import { lowerCase, startCase } from 'lodash/fp';
import { v4 as uuid } from 'uuid';

import {
  getLatestRawQuery,
  getLatestValueByDB,
  getService,
  isLocalizedContentType,
} from '../utils/common';

const VERSIONS_QUERY_FILTER = 'versions';

// TODO: Test query efficiency for larger datasets
const findLatestInLocale = async (model, fields) => {
  const where = ['vuid=a.vuid'];

  const mapColumnToField = {};
  const cols = fields.map((field) => {
    const dbColumn = `${startCase(field).split(' ').map(lowerCase).join('_')}`;
    mapColumnToField[dbColumn] = field;
    return 'a.' + dbColumn;
  });

  // TODO: Localizations also apply decorator which strips all except main locale entity
  //  $and: [{ locale: await getDefaultLocale() }].concat(params.filters || []),
  if (isLocalizedContentType(model)) {
    cols.push('a.locale');
    where.push('locale=a.locale');
  }
  const rawQuery = `SELECT ${cols.join(', ')} 
        FROM ${model.collectionName} a WHERE NOT EXISTS (
            SELECT 1 FROM ${model.collectionName} WHERE ${where.join(
              ' AND ',
            )} AND (
                CASE WHEN a.published_at is null THEN (
                    published_at is not null OR version_number > a.version_number
                )
                ELSE published_at is not null AND version_number > a.version_number
                END
            )
        )`;

  const result = await strapi.db.connection.raw(rawQuery);
  if (result?.rows) {
    return result?.rows.map((row) => {
      const entity = {};
      for (const col in mapColumnToField) {
        entity[mapColumnToField[col]] = row[col] ?? null;
      }
      return entity;
    });
  }
  return [];
};

/**
 * Decorates the entity service with Content Versioning logic
 * - As decorator API passes into official Strapi support, could move most logic here
 * - We wanted to provide users with the ability to create a new version of the content every time the save button is clicked
 * - To achieve this we needed to create a patch for the Strapi Admin package and change the url of the API call
 *   when the save button is clicked to the url exposed by our plugin.
 * - However, patching the package was not convenient so we later solved this by using Strapi's internal API - entity service decorator.
 * @param {object} service - entity service
 */
const decorator = (service) => ({
  /**
   * Wraps query options. For versioned models display only published/newest versions
   * @param {object} opts - Query options object (params, data, files, populate)
   * @param {object} ctx - Query context
   * @param {object} ctx.model - Model that is being used
   */
  async wrapParams(params = {}, ctx = {}) {
    const { isVersionedContentType } = getService('content-types');
    // @ts-expect-error fix-types
    const model = strapi.getModel(ctx.uid);
    const wrappedParams = await service.wrapParams.call(this, params, ctx);

    // Optional override with VERSIONS_QUERY_FILTER: 'all'
    if (
      isVersionedContentType(model) &&
      params[VERSIONS_QUERY_FILTER] !== 'all'
    ) {
      wrappedParams.filters = {
        $and: [{ isVisibleInListView: true }].concat(
          wrappedParams.filters || [],
        ),
      };
    }

    return wrappedParams;
  },

  /**
   * Creates an entry & make links between it and its related versions and localizations
   * @param {string} uid - Model uid
   * @param {object} opts - Query options object (params, data, files, populate)
   */
  async create(uid, opts: { data?: any } = {}) {
    const { isVersionedContentType } = getService('content-types');
    const model = strapi.getModel(uid);
    const isLocalized = isLocalizedContentType(model);
    const isVersioned = isVersionedContentType(model);
    console.log(';; deco-isVer ', isVersioned, model, uid, opts);
    if (!isVersioned) {
      return service.create.call(this, uid, opts);
    }
    const { data } = opts;
    if (isLocalized && data?.localizations?.length) {
      const relatedLocaleItem = await strapi.db.query(uid).findOne({
        where: {
          id: data.localizations[0],
        },
        populate: {
          createdBy: true,
        },
      });
      data.vuid = relatedLocaleItem.vuid;
    } else if (!data.vuid) {
      data.vuid = uuid();
      data.versionNumber = 1;
      data.isVisibleInListView = true;
    }

    const entry = await service.create.call(this, uid, opts);
    console.log(';; deco-created ', entry);

    return entry;
  },

  /**
   * Updates an entry & update related versions
   * @param {string} uid
   * @param {string} entityId
   * @param {object} opts - Query options object (params, data, files, populate)
   */
  async update(uid, entityId, opts) {
    const { isVersionedContentType, createNewVersion } =
      getService('content-types');
    const model = strapi.getModel(uid);
    const { data } = opts;
    const isLocalized = isLocalizedContentType(model);
    // @ts-expect-error fix-types
    const attrName = _.snakeCase(model.info.singularName);
    const collectionName = _.snakeCase(model.collectionName);
    const prevVersion = await strapi.db.query(uid).findOne({
      where: {
        id: entityId,
      },
    });

    const isVersioned = isVersionedContentType(model);
    console.log(';; deco-up-isVer ', isVersioned, model, uid, opts);

    if (!isVersioned || data.hasOwnProperty('publishedAt')) {
      // /Is not versioned content or is just publishing/unpublishing
      if (data.publishedAt && isVersioned) {
        const item = prevVersion;

        await strapi.db.query(uid).update({
          where: {
            id: item.id,
          },
          data: {
            isVisibleInListView: true,
          },
        });

        const where = {
          vuid: item.vuid,
          id: {
            $ne: item.id,
          },
        };
        // @ts-expect-error fix-types
        if (isLocalized) where.locale = item.locale;
        await strapi.db.query(uid).updateMany({
          where,
          data: {
            publishedAt: null, // not when creating
            isVisibleInListView: false,
          },
        });

        // Relink logic for localizations
        if (isLocalized) {
          const latestInLocales = await strapi.db.connection.raw(
            `SELECT a.id, a.locale, a.version_number, a.published_at
        FROM ${collectionName} a WHERE NOT EXISTS (
          SELECT 1 FROM ${collectionName} WHERE locale=a.locale AND vuid=a.vuid AND (
           CASE WHEN a.published_at is null THEN (
             published_at is not null OR version_number > a.version_number
          )
          ELSE published_at is not null AND version_number > a.version_number
          END
          )
        ) AND vuid = '${item.vuid}'`,
          );
          const latestByLocale = {};
          for (const latest of getLatestValueByDB(latestInLocales)) {
            latestByLocale[latest.locale] = latest.id;
          }

          // !set the current as latest in locale
          latestByLocale[item.locale] = item.id;
          const allVersionsOtherLocales = await strapi.db.query(uid).findMany({
            where: {
              vuid: item.vuid,
              locale: {
                $ne: item.locale,
              },
            },
          });

          for (const entity of allVersionsOtherLocales) {
            await strapi.db.connection.raw(
              `DELETE FROM ${collectionName}_localizations_links WHERE ${attrName}_id=${entity.id}`,
            );

            const latestIds = Object.values(
              _.omit(latestByLocale, entity.locale),
            );
            const sqlValues = latestIds.map(
              (latest) => `(${entity.id}, ${latest})`,
            );
            if (!sqlValues?.length) continue;

            await strapi.db.connection.raw(
              `INSERT INTO ${collectionName}_localizations_links (${attrName}_id, inv_${attrName}_id) VALUES ` +
                sqlValues.join(','),
            );
          }
        }
      }

      return service.update.call(this, uid, entityId, opts);
    }

    // /if isVersioned and no publishedAt
    data.locale = prevVersion.locale;
    let hasPublishedVersion = false;
    let olderVersions = [];
    const latestByLocale = {};

    const where = { vuid: data.vuid };
    // @ts-expect-error fix-types
    if (isLocalized) where.locale = data.locale;

    olderVersions = await strapi.db.query(uid).findMany({
      where,
      populate: {
        createdBy: true,
      },
    });

    console.log(';; up-old-ver ', olderVersions);

    const latestVersion = _.maxBy(olderVersions, (v) => v.versionNumber);
    const latestVersionNumber = latestVersion && latestVersion.versionNumber;
    data.versionNumber = (latestVersionNumber || 0) + 1;

    try {
      if (olderVersions && olderVersions.length > 0) {
        // use relatedEntity data instead of olderVers ?!
        data.createdBy = olderVersions[0].createdBy.id;
      }
    } catch (e) {
      // Fallback set logged user ID
      data.createdBy = data.updatedBy;
    }
    // Select latest(or published) for each locale
    const latestQuery = getLatestRawQuery(model, data.vuid);
    const latestInLocales = await strapi.db.connection.raw(latestQuery);

    for (const latest of getLatestValueByDB(latestInLocales)) {
      // Is version the new latest in locale?
      if (!isLocalized || data.locale === latest.locale) {
        hasPublishedVersion = Boolean(latest.published_at);
      }
      latestByLocale[latest.locale] = latest.id;
    }

    if (!data.publishedAt && hasPublishedVersion) {
      data.isVisibleInListView = false;
    } else {
      data.isVisibleInListView = true;

      const where = { vuid: data.vuid };
      // if (isLocalized) where.locale = data.locale;

      await strapi.db.query(uid).updateMany({
        where,
        data: {
          isVisibleInListView: false,
          publishedAt: null,
        },
      });
    }

    data.versions = olderVersions.map((v) => v.id);

    if (isLocalized) {
      // omit current locale
      data.localizations = Object.values(_.omit(latestByLocale, data.locale));
    }
    // remove old ids
    const newData = await createNewVersion(uid, data, model);

    // Create Version
    const result = await service.create.call(this, uid, {
      ...opts,
      data: newData,
    });

    console.log(';; create-ver ', result);

    // Relink all versions from other locales if result is The latest(published)!
    if (result.isVisibleInListView && isLocalized) {
      // !set the current as latest in locale
      latestByLocale[result.locale] = result.id;

      const allVersionsOtherLocales = await strapi.db.query(uid).findMany({
        where: {
          vuid: result.vuid,
          locale: {
            $ne: result.locale,
          },
        },
      });

      for (const entity of allVersionsOtherLocales) {
        await strapi.db.connection.raw(
          `DELETE FROM ${collectionName}_localizations_links WHERE ${attrName}_id=${entity.id}`,
        );

        const latestIds = Object.values(_.omit(latestByLocale, entity.locale));
        const sqlValues = latestIds.map(
          (latest) => `(${entity.id}, ${latest})`,
        );
        if (!sqlValues?.length) continue;

        await strapi.db.connection.raw(
          `INSERT INTO ${collectionName}_localizations_links (${attrName}_id, inv_${attrName}_id) VALUES ` +
            sqlValues.join(','),
        );
      }
    }

    for (const version of olderVersions) {
      await strapi.db.connection.raw(
        `INSERT INTO ${collectionName}_versions_links (${attrName}_id, inv_${attrName}_id) VALUES (${version.id},${result.id})`,
      );
    }
    return result;
  },

  /**
   * Deletes an entry & updates links between related localizations
   * @param {string} uid
   * @param {string} entityId
   * @param {object} opts - Query options object (params, data, files, populate)
   */
  async delete(uid, entityId, opts) {
    const model = strapi.getModel(uid);
    // @ts-expect-error fix-types
    const attrName = _.snakeCase(model.info.singularName);
    const collectionName = _.snakeCase(model.collectionName);
    const isLocalized = isLocalizedContentType(model);
    const { isVersionedContentType } = getService('content-types');

    if (!isVersionedContentType(model)) {
      return service.delete.call(this, uid, entityId, opts);
    }

    const item = await strapi.db
      .query(uid)
      .findOne({ where: { id: entityId } });

    const where = { vuid: item.vuid };
    // @ts-expect-error fix-types
    if (isLocalized) where.locale = item.locale;
    await strapi.db.query(uid).updateMany({
      where,
      data: {
        isVisibleInListView: false,
      },
    });

    // Relink logic for localizations
    if (isLocalized) {
      const latestInLocales = await strapi.db.connection.raw(
        `SELECT a.id, a.locale, a.version_number, a.published_at
        FROM ${collectionName} a WHERE NOT EXISTS (
          SELECT 1 FROM ${model.collectionName}
          WHERE locale=a.locale AND vuid=a.vuid AND id!='${item.id}'  AND (
          CASE WHEN a.published_at is null THEN (
            published_at is not null OR version_number > a.version_number
          )
          ELSE published_at is not null AND version_number > a.version_number
          END
          )
        ) AND vuid = '${item.vuid}' AND id!=${item.id}`,
      );

      const latestByLocale = {};
      for (const latest of getLatestValueByDB(latestInLocales)) {
        latestByLocale[latest.locale] = latest.id;
      }

      if (latestByLocale[item.locale]) {
        await strapi.db.query(model.uid).update({
          where: {
            ...where,
            id: latestByLocale[item.locale],
          },
          data: {
            isVisibleInListView: true,
          },
        });
      }

      const allVersionsOtherLocales = await strapi.db.query(uid).findMany({
        where: {
          vuid: item.vuid,
          locale: {
            $ne: item.locale,
          },
        },
      });

      for (const entity of allVersionsOtherLocales) {
        await strapi.db.connection.raw(
          `DELETE FROM ${collectionName}_localizations_links WHERE ${attrName}_id=${entity.id}`,
        );

        const latestIds = Object.values(_.omit(latestByLocale, entity.locale));
        const sqlValues = latestIds.map(
          (latest) => `(${entity.id}, ${latest})`,
        );
        if (!sqlValues?.length) continue;

        await strapi.db.connection.raw(
          `INSERT INTO ${collectionName}_localizations_links (${attrName}_id, inv_${attrName}_id) VALUES ` +
            sqlValues.join(','),
        );
      }
    } else {
      const latestVersion = await strapi.db.connection.raw(
        `SELECT a.id, a.version_number, a.published_at
        FROM ${collectionName} a WHERE NOT EXISTS (
          SELECT 1 FROM ${model.collectionName}
          WHERE vuid=a.vuid AND id!='${item.id}'  AND (
          CASE WHEN a.published_at is null THEN (
            published_at is not null OR version_number > a.version_number
          )
          ELSE published_at is not null AND version_number > a.version_number
          END
          )
        ) AND vuid = '${item.vuid}' AND id!='${item.id}'`,
      );
      if (getLatestValueByDB(latestVersion).length) {
        await strapi.db.query(model.uid).update({
          where: {
            ...where,
            id: getLatestValueByDB(latestVersion)[0].id,
          },
          data: {
            isVisibleInListView: true,
          },
        });
      }
    }
    return service.delete.call(this, uid, entityId, opts);
  },
});

export const entityServiceDecorator = () => ({
  decorator,
});

export default entityServiceDecorator;
