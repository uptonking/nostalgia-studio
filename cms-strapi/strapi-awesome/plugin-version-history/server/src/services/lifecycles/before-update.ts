import _ from 'lodash';

import type { Strapi } from '@strapi/strapi';

export const beforeUpdate = async (event, strapi: Strapi) => {
  const { action, params, model } = event;
  const { data, where, select, populate } = params;

  event.state = 'beforeUpdateState';

  const fullData = await strapi.db.query(model.uid).findOne({ where });

  const olderVersions = await strapi.db.query(model.uid).findMany({
    where: { vuid: fullData.vuid },
    populate: { createdBy: true },
  });
  const latestVersion = _.maxBy(olderVersions, (v) => v.versionNumber);
  const latestVersionNumber = latestVersion?.versionNumber;

  data.vuid = fullData.vuid;
  data.versionNumber = (latestVersionNumber || 0) + 1;
  data.isVisibleInListView = true;

  ['id', 'createdAt', 'updatedAt', 'publishedAt'].forEach((p) => {
    if (fullData[p]) {
      delete fullData[p];
    }
  });

  await strapi.db.query(model.uid).create({
    data: { ...fullData, isVisibleInListView: false },
  });

  console.log(';; up-old-ver ', olderVersions);

  console.log(
    ';; beforeUpdate ',
    params,
    action,
    latestVersionNumber,
    fullData,
  );
};
