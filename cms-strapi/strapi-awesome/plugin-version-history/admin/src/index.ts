import * as yup from 'yup';

import pluginPkg from '../../package.json';
import { CheckboxConfirmation } from './components/checkbox-confirmation';
import { Initializer } from './components/initializer';
import { Versions } from './components/versions';
import { addColumnToTableHook } from './hooks/add-column-to-table';
import { middlewares } from './middlewares';
import { pluginId } from './pluginId';
import { getTrad } from './utils';
import { mutateCTBContentTypeSchema } from './utils/mutate-ctb-content-type-schema';
import { prefixPluginTranslations } from './utils/prefix-plugin-translations';

const pluginName = pluginPkg.strapi.name;

export default {
  register(app) {
    app.addMiddlewares(middlewares);

    app.registerPlugin({
      id: pluginId,
      name: pluginName,
      initializer: Initializer,
      isReady: false,
    });
  },

  bootstrap(app) {
    app.injectContentManagerComponent('editView', 'right-links', {
      name: 'Versions',
      Component: Versions,
    });

    // Hook that adds a column into the CM's LV table
    app.registerHook(
      'Admin/CM/pages/ListView/inject-column-in-table',
      addColumnToTableHook,
    );

    const ctbPlugin = app.getPlugin('content-type-builder');
    if (ctbPlugin) {
      const ctbFormsAPI = ctbPlugin.apis.forms;
      ctbFormsAPI.addContentTypeSchemaMutation(mutateCTBContentTypeSchema);
      ctbFormsAPI.components.add({
        id: 'checkboxConfirmation',
        component: CheckboxConfirmation,
      });

      ctbFormsAPI.extendContentType({
        validator: () => ({
          versions: yup.object().shape({
            versioned: yup.bool(),
          }),
        }),
        form: {
          advanced() {
            return [
              {
                name: 'pluginOptions.versions.versioned',
                type: 'checkboxConfirmation',
                intlLabel: {
                  id: getTrad(
                    'plugin.schema.versions.versioned.label-content-type',
                  ),
                  defaultMessage: 'Enable versioning for this Content-Type',
                },
                description: {
                  id: getTrad(
                    'plugin.schema.versions.versioned.description-content-type',
                  ),
                  defaultMessage: 'Allow you to keep older versions of content',
                },
              },
            ];
          },
        },
      });
    }
  },
  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      }),
    );

    return Promise.resolve(importedTrads);
  },
};
