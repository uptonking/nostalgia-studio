import pluginPkg from '../../package.json';

// const pluginPkg = require('../package.json');

const pluginId = pluginPkg.name.replace(/^@notum-cz\/strapi-plugin-/i, '');

export default pluginId;
