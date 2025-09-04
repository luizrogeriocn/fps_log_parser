const base = require('./jest.config');

module.exports = {
  ...base,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testRegex: '.*\\.integration\\.spec\\.ts$',
  coverageDirectory: './coverage/integration',
};

