export default () => ({
  'custom-api': {
    enabled: true,
  },
  'content-versioning': {
    enabled: true,
  },
  'csv-upload': {
    enabled: true,
  },
  'csv-export': {
    enabled: true,
  },
  'bulk-operator': {
    enabled: true,
  },
  navigation: {
    enabled: true,
  },
  reactions: {
    enabled: false, // error when accessing content item
  },
  oembed: {
    enabled: true,
  },
  scheduler: {
    enabled: true,
    config: {
      contentTypes: {
        // 'api::movie.movie': {} // empty is ok
        'api::movie.movie': {
          initialPublishAtDate: new Date(
            new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
          ).toDateString(),
          initialArchiveAtDate: new Date(
            new Date().getTime() + 30 * 24 * 60 * 60 * 1000,
          ).toDateString(),
        },
      },
    },
  },
  'fuzzy-search': {
    enabled: true,
    config: {
      contentTypes: [
        {
          uid: 'api::revision2024.revision2024',
          modelName: 'revision2024',
          fuzzysortOptions: {
            characterLimit: 300,
            threshold: -600,
            limit: 10,
            keys: [
              {
                name: 'rich_content',
                weight: 100,
              },
            ],
          },
        },
      ],
    },
  },
  'graphs-builder': {
    enabled: false,
  },
  'content-export-import': {
    enabled: false,
  },
  comments: {
    enabled: false,
  },
  transformer: {
    enabled: false,
  },
  io: {
    enabled: false,
  },
  'strapi-advanced-uuid': {
    enabled: false,
  },
  'generate-data': {
    enabled: false,
  },
  'strapi-plugin-cron': {
    enabled: false,
  },
  'rest-cache': {
    enabled: false,
  },
  'entity-notes': {
    enabled: false,
  },
  categorizer: {
    enabled: false,
  },
  'strapi-plugin-audit-log-marje3': {
    enabled: false,
  },
  'strapi-content-type-explorer': {
    enabled: false,
  },
  'strapi-plugin-populate-deep': {
    enabled: false,
    config: {
      defaultDepth: 3, // Default is 5
    },
  },
  'import-export-entries': {
    enabled: false,
  },
  'file-system': {
    enabled: false,
  },
  'media-browser': {
    enabled: false,
  },
  'media-preview': {
    enabled: false,
  },
});
