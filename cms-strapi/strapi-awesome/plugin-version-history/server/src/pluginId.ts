import pluginPkg from '../../package.json';

// const pluginPkg = require('../package.json');

export const pluginId = pluginPkg.name.replace(/^strapi-plugin-/i, '');

export default pluginId;
