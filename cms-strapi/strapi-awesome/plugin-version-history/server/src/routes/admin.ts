export const adminRoutes = [
  {
    method: 'POST',
    // legacy logic for save button
    path: `/:slug/save`,
    handler: 'admin.save',
    config: {
      policies: [
        // 'admin::isAuthenticatedAdmin',
        // {
        //   name: 'admin::hasPermissions',
        //   config: {
        //     actions: ['plugin::version-history.save'],
        //   },
        // },
      ],
    },
  },
  {
    method: 'PUT',
    path: '/:slug/:id/update-version',
    handler: 'admin.updateVersion',
    config: {
      policies: [
        //   'admin::isAuthenticatedAdmin',
        //   {
        //     name: 'admin::hasPermissions',
        //     config: {
        //       actions: ['plugin::version-history.save'],
        //     },
        //   },
      ],
    },
  },
];
