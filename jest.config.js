// jest.config.js - Version corrigée
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'], // Ne prendre que les fichiers .test.ts
    transform: {
      '^.+\\.ts$': 'ts-jest',
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    verbose: true,
    testTimeout: 10000,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    setupFilesAfterEnv: [], // Retirer setup.ts si problème
  };