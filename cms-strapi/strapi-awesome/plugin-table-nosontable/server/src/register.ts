import type { Core } from '@strapi/types';

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  // register phase
  strapi.customFields.register({
    name: 'table-nosontable',
    plugin: 'table-nosontable',
    type: 'string',
    inputSize: {
      default: 12,
      isResizable: false,
    },
  });
};

export default register;
