module.exports = {
  displayName: 'Electron Main Process',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/electron/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2024',
          parser: { syntax: 'typescript' },
        },
        module: { type: 'commonjs' },
      },
    ],
  },
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.electron.js'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
};
