import * as yup from 'yup';

import pluginPkg from '../../package.json';
import { CheckboxVersioned } from './components/checkbox-versioned';
import { Initializer } from './components/initializer';
import { VersionTrailPanel } from './components/version-trail-panel';
import { pluginId } from './pluginId';
import { getTrad } from './utils/get-trad';
import { prefixPluginTranslations } from './utils/prefix-plugin-translations';
import { reducer } from './store/reducers';

const name = pluginPkg.strapi.name;

const App = {
  register(app) {
    app.registerPlugin({
      id: pluginId,
      name,
      initializer: Initializer,
      isReady: false,
    });

    app.addReducers({
      [pluginId]: reducer,
    });
  },

  bootstrap(app) {
    app.injectContentManagerComponent('editView', 'right-links', {
      name: 'Version Trail',
      Component: VersionTrailPanel,
    });

    const ctbPlugin = app.getPlugin('content-type-builder');

    if (ctbPlugin) {
      const ctbFormsAPI = ctbPlugin.apis.forms;

      ctbFormsAPI.components.add({
        id: 'pluginVersionTrailCheckboxConfirmation',
        component: CheckboxVersioned,
      });

      ctbFormsAPI.extendContentType({
        validator: () => ({
          versionTrail: yup.object().shape({
            enabled: yup.bool(),
          }),
        }),
        form: {
          advanced() {
            return [
              {
                name: 'pluginOptions.versionTrail.enabled',
                description: {
                  id: getTrad(
                    'plugin.schema.versionTrail.description-content-type',
                  ),
                  defaultMessage:
                    'Enable Version Trail auditing and content versioning for this content type',
                },
                type: 'pluginVersionTrailCheckboxConfirmation',
                intlLabel: {
                  id: getTrad('plugin.schema.versionTrail.label-content-type'),
                  defaultMessage: 'Version Trail',
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
        return import(
          /* webpackChunkName: "pt-translation-[request]" */ `./translations/${locale}.json`
        )
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

export default App;
