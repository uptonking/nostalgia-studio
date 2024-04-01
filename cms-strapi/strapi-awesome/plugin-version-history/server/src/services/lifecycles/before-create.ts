import { v4 as uuid } from 'uuid';

// import type { Strapi } from '@strapi/strapi';

export const beforeCreate = async (event, strapi) => {
  const { data, where, select, populate } = event?.params;

  if (!data.vuid) {
    data.vuid = uuid();
    data.versionNumber = 1;
    data.isVisibleInListView = true;
  }

  console.log(';; beforeCreate ', event?.params);
};
