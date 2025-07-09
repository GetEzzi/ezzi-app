module.exports = {
  displayName: 'React Renderer Process',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.spec.{ts,tsx}'],
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          types: ['jest', 'jsdom'],
        },
      },
    ],
  },
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.renderer.js'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
};
