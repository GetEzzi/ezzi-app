module.exports = {
  displayName: 'Electron Main Process',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/electron/**/*.spec.ts'],
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          types: ['jest', 'node'],
        },
      },
    ],
  },
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.electron.js'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
};
