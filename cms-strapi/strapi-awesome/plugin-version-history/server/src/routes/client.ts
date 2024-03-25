export const clientRoutes = [
  {
    method: 'POST',
    path: '/:slug/:itemId',
    handler: 'client.create',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/:slug',
    handler: 'client.findAllForUser',
    config: {
      policies: [],
    },
  },
];
