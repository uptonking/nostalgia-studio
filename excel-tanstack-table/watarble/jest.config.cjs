const baseConfig = require('../../config/jest.base');
const pkgConfig = {
  displayName: 'watarble',
  rootDir: '.',
  // setupFilesAfterEnv: ['<rootDir>/config/setupTests.js'],
};

module.exports = {
  ...baseConfig,
  ...pkgConfig,
};
