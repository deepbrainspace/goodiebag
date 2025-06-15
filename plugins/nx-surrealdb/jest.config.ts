/* eslint-disable */
export default {
  displayName: 'nx-surrealdb',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  maxWorkers: 1,
  workerIdleMemoryLimit: '1024MB',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      useESM: true
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/tools/plugins/nx-surrealdb',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/files/**',
    '!jest.config.ts',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testEnvironmentOptions: {
    node: {
      experimentalVMModules: true
    }
  }
};