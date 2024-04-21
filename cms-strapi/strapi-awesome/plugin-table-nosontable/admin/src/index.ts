import { Initializer } from './components/Initializer';
import { NosontableIcon } from './components/PluginIcon';
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
      type: 'string',
      icon: NosontableIcon,
      intlLabel: {
        id: getTrad('table-nosontable.label'),
        defaultMessage: 'Nosontable Editor',
      },
      intlDescription: {
        id: getTrad('table-nosontable.description'),
        defaultMessage: 'handsontable-based table editor',
      },
      components: {
        Input: () => import('./components/nosontable-editor'),
      },
      options: {
        base: [],
        advanced: [
          // {
          //   sectionTitle: {
          //     id: 'table-nosontable.tools.settings',
          //     defaultMessage: 'Tools settings, enabling / disabling tools',
          //   },
          //   items: [
          //     {
          //       name: 'options.header',
          //       type: 'checkbox',
          //       defaultValue: true,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.header',
          //         defaultMessage: 'Header',
          //       },
          //     },
          //     {
          //       name: 'options.list',
          //       type: 'checkbox',
          //       defaultValue: true,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.list',
          //         defaultMessage: 'List',
          //       },
          //     },
          //     {
          //       name: 'options.checklist',
          //       type: 'checkbox',
          //       defaultValue: true,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.checklist',
          //         defaultMessage: 'Checklist',
          //       },
          //     },
          //     {
          //       name: 'options.table',
          //       type: 'checkbox',
          //       defaultValue: true,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.table',
          //         defaultMessage: 'Table',
          //       },
          //     },
          //     {
          //       name: 'options.warning',
          //       type: 'checkbox',
          //       defaultValue: true,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.warning',
          //         defaultMessage: 'Warning',
          //       },
          //     },
          //     {
          //       name: 'options.code',
          //       type: 'checkbox',
          //       defaultValue: true,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.code',
          //         defaultMessage: 'Code',
          //       },
          //     },
          //     {
          //       name: 'options.link_tool',
          //       type: 'checkbox',
          //       defaultValue: true,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.link_tool',
          //         defaultMessage: 'Link tool',
          //       },
          //     },
          //     {
          //       name: 'options.raw',
          //       type: 'checkbox',
          //       defaultValue: true,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.raw',
          //         defaultMessage: 'Raw',
          //       },
          //     },
          //     {
          //       name: 'options.quote',
          //       type: 'checkbox',
          //       defaultValue: true,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.quote',
          //         defaultMessage: 'Quote',
          //       },
          //     },
          //     {
          //       name: 'options.marker',
          //       type: 'checkbox',
          //       defaultValue: true,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.marker',
          //         defaultMessage: 'Marker',
          //       },
          //     },
          //     {
          //       name: 'options.delimiter',
          //       type: 'checkbox',
          //       defaultValue: true,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.delimiter',
          //         defaultMessage: 'Delimiter',
          //       },
          //     },
          //     {
          //       name: 'options.inlineCode',
          //       type: 'checkbox',
          //       defaultValue: true,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.inlineCode',
          //         defaultMessage: 'Inline Code',
          //       },
          //     },
          //     {
          //       name: 'options.image',
          //       type: 'checkbox',
          //       defaultValue: true,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.image',
          //         defaultMessage: 'Image',
          //       },
          //     },
          //     {
          //       name: 'options.component',
          //       type: 'checkbox',
          //       defaultValue: false,
          //       intlLabel: {
          //         id: 'table-nosontable.tools.settings.component',
          //         defaultMessage: 'Component selector',
          //       },
          //     },
          //   ],
          // },
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
                  id: getTrad(
                    'table-nosontable.options.advanced.requiredField',
                  ),
                  defaultMessage: 'Required field',
                },
                description: {
                  id: getTrad(
                    'table-nosontable.options.advanced.requiredField.description',
                  ),
                  defaultMessage:
                    "You won't be able to create an entry if this field is empty",
                },
              },
            ],
          },
        ],
        validator: (): Record<string, any> => ({}),
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
