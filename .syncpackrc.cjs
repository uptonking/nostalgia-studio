// @ts-check

/** @type {import("syncpack").RcFile} */
const config = {
  // "customTypes": [],
  dependencyTypes: ['dev', 'prod', 'peer', 'resolutions'],
  filter: '.',
  indent: '  ',
  // "sortAz": [
  //   "contributors",
  //   "dependencies",
  //   "devDependencies",
  //   "keywords",
  //   "peerDependencies",
  //   "resolutions",
  //   "scripts"
  // ],
  sortFirst: ['name', 'description', 'version', 'author'],
  // source: ['package.json'],
  semverGroups: [
    // {
    //   packages: ['@examples-hub/react-play-versions'],
    //   dependencies: ['@tanstack/react-query'],
    //   isIgnored: true,
    // },
  ],
  versionGroups: [
    {
      label: 'special chai pkg ver in pouchdb',
      packages: ['pouchdb'],
      dependencies: ['chai'],
      pinVersion: '3.5.0',
    },
  ],
};

module.exports = config;
