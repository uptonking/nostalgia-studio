// import type { Strapi } from '@strapi/strapi';

// const register = ({ strapi }: { strapi: Strapi }) => {
const register = ({ strapi }) => {
  // register phase
  strapi.customFields.register({
    name: 'editor-quill',
    plugin: 'editor-quill',
    type: 'string',
    inputSize: {
      default: 12,
      isResizable: false,
    },
  });
};

export default register;
