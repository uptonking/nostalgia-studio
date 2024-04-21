import pluginPkg from '../../package.json';

// export const PLUGIN_ID = 'plugin11';

export const PLUGIN_ID = pluginPkg.name.replace(/^strapi-plugin-/i, '');

export default PLUGIN_ID;
