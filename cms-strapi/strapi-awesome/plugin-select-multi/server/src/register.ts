import type { Core } from '@strapi/types';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // register phase
  strapi.customFields.register({
    name: 'select-multi',
    plugin: 'select-multi',
    type: 'json',
  });
};

export default register;
