import pluginPkg from '../../package.json';

export const pluginId = pluginPkg.name.replace(/^strapi-plugin-/i, '');

export default pluginId;
