export default [
  {
    method: 'GET',
    path: '/:contentType',
    handler: 'exportController.exportCSV',
    config: {
      policies: [],
    },
  },
];
