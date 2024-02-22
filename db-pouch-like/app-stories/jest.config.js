const baseConfig = require('../../config/jest.base');
const pkgConfig = {
  displayName: 'pouch-react-stories',
  rootDir: '../..',
  setupFilesAfterEnv: ['<rootDir>/config/setupTests.js'],
};

module.exports = {
  ...baseConfig,
  ...pkgConfig,
};
