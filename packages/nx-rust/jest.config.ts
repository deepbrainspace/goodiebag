/* eslint-disable */
export default {
  displayName: 'nx-rust',
  preset: 'ts-jest',
  testEnvironment: 'node',
  maxWorkers: 1,
  workerIdleMemoryLimit: '1024MB',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js'],
  coverageDirectory: './coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/files/**', '!jest.config.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
};
