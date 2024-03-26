const actions = [
  {
    section: 'plugins',
    displayName: 'Save version',
    uid: 'save',
    pluginName: 'version-history',
  },
];

export const registerVersionsActions = async () => {
  const { actionProvider } = strapi.admin.services.permission;

  await actionProvider.registerMany(actions);
};
