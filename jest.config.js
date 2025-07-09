module.exports = {
  projects: [
    '<rootDir>/jest.electron.config.js',
    '<rootDir>/jest.renderer.config.js',
  ],
  testTimeout: 10000,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'electron/**/*.ts',
    'shared/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};
