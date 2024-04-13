import { MultiSelectIcon } from './components/field-icon';
import { Initializer } from './components/Initializer';
import { PLUGIN_ID } from './pluginId';
import { getTrad } from './utils/getTranslation';
import { prefixPluginTranslations } from './utils/prefixPluginTranslations';

export default {
  register(app: any) {
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });

    app.customFields.register({
      name: PLUGIN_ID,
      pluginId: PLUGIN_ID,
      type: 'json',
      icon: MultiSelectIcon,
      intlLabel: {
        id: getTrad('select-multi.label'),
        defaultMessage: 'Multi Select',
      },
      intlDescription: {
        id: getTrad('select-multi.description'),
        defaultMessage: 'Select multiple options from a list',
      },
      components: {
        Input: () => import('./components/field-multi-select'),
      },
      options: {
        base: [
          {
            sectionTitle: null,
            items: [
              {
                name: 'options',
                type: 'textarea-enum',
                intlLabel: {
                  id: getTrad('select-multi.enum.label'),
                  defaultMessage: 'Options (one per line)',
                },
                description: {
                  id: getTrad('select-multi.enum.description'),
                  defaultMessage:
                    'Enter one option per line. You can also add a value and a label separated by a colon (e.g. "label:value").\nIf no value is provided, the label will be used as the value',
                },
                placeholder: {
                  id: getTrad('select-multi.enum.placeholder'),
                  defaultMessage: 'Ex:\nOption 1\nOption 2\nOption 3:option-3',
                },
              },
            ],
          },
        ],
        advanced: [
          {
            sectionTitle: {
              id: 'global.settings',
              defaultMessage: 'Settings',
            },
            items: [
              {
                name: 'required',
                type: 'checkbox',
                intlLabel: {
                  id: 'form.attribute.item.requiredField',
                  defaultMessage: 'Required field',
                },
                description: {
                  id: 'form.attribute.item.requiredField.description',
                  defaultMessage:
                    "You won't be able to create an entry if this field is empty",
                },
              },
              {
                name: 'private',
                type: 'checkbox',
                intlLabel: {
                  id: 'form.attribute.item.private',
                  defaultMessage: 'Private field',
                },
                description: {
                  id: 'form.attribute.item.private.description',
                  defaultMessage:
                    'This field will not show up in the API response',
                },
              },
            ],
          },
        ],
      },
    });
  },

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTranslations = await Promise.all(
      (locales as string[]).map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, PLUGIN_ID),
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

    return importedTranslations;
  },
};
