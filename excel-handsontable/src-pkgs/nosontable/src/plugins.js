import { objectEach } from './helpers/object';
import { toUpperCaseFirst } from './helpers/string';
/**
 * Utility to register plugins and common namespace for keeping reference to all plugins classes
 */
import Hooks from './plugin-hooks';

const registeredPlugins = new WeakMap();

/**
 * Registers plugin under given name
 *
 * @param {String} pluginName
 * @param {Function} PluginClass
 */
function registerPlugin(pluginName, PluginClass) {
  const correctedPluginName = toUpperCaseFirst(pluginName);

  Hooks.getSingleton().add('construct', function () {
    if (!registeredPlugins.has(this)) {
      registeredPlugins.set(this, {});
    }

    const holder = registeredPlugins.get(this);
    if (!holder[correctedPluginName]) {
      holder[correctedPluginName] = new PluginClass(this);
    }
  });
  Hooks.getSingleton().add('afterDestroy', function () {
    if (registeredPlugins.has(this)) {
      const pluginsHolder = registeredPlugins.get(this);

      objectEach(pluginsHolder, (plugin) => plugin.destroy());
      registeredPlugins.delete(this);
    }
  });
}

/**
 * @param {Object} instance
 * @param {String|Function} pluginName
 * @returns {Function} pluginClass Returns plugin instance if exists or `undefined` if not exists.
 */
function getPlugin(instance, pluginName) {
  if (typeof pluginName !== 'string') {
    throw Error('Only strings can be passed as "plugin" parameter');
  }
  const _pluginName = toUpperCaseFirst(pluginName);

  if (
    !registeredPlugins.has(instance) ||
    !registeredPlugins.get(instance)[_pluginName]
  ) {
    return undefined;
  }

  return registeredPlugins.get(instance)[_pluginName];
}

/**
 * Get all registered plugins names for concrete Handsontable instance.
 *
 * @param {Object} hotInstance
 * @returns {Array}
 */
function getRegisteredPluginNames(hotInstance) {
  return registeredPlugins.has(hotInstance)
    ? Object.keys(registeredPlugins.get(hotInstance))
    : [];
}

/**
 * Get plugin name.
 *
 * @param {Object} hotInstance
 * @param {Object} plugin
 * @returns {String|null}
 */
function getPluginName(hotInstance, plugin) {
  let pluginName = null;

  if (registeredPlugins.has(hotInstance)) {
    objectEach(registeredPlugins.get(hotInstance), (pluginInstance, name) => {
      if (pluginInstance === plugin) {
        pluginName = name;
      }
    });
  }

  return pluginName;
}

export { registerPlugin, getPlugin, getRegisteredPluginNames, getPluginName };
