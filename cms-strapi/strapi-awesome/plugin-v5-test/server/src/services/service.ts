// import type { Strapi } from '@strapi/strapi';

// const service = ({ strapi }: { strapi: Strapi }) => ({
const service = ({ strapi }) => ({
  getWelcomeMessage() {
    return 'Welcome to Strapi 🚀';
  },
});

export default service;
