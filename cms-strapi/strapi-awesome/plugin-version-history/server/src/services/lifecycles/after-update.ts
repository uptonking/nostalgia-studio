// import type { Strapi } from '@strapi/strapi';

export const afterUpdate = async (event, strapi) => {
  const { action, model, result, params } = event;
  const { data, where, select, populate } = params;

  result['aa'] = 'aaa';
  console.log(';; afterUpdate ', event.state, result, action);
};
