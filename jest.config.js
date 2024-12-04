module.exports = {
  transform: {'^.+\\.ts?$': 'ts-jest'},
  testEnvironment: 'node',
  testRegex: '/.*\\.spec?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'js']
};
