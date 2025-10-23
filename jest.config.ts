import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    coverageProvider: 'v8',
    testTimeout: 11000,
    testMatch: [
        '**/__tests__/**/*.ts',
        '**/?(*.)+(spec|test).ts',
        '**/test/**/*.ts'
    ],

    transform: { '^.+\\.ts$': 'ts-jest' },

    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/*.test.ts',
        '!src/**/__tests__/**',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],

    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },

    setupFilesAfterEnv: [],

    coverageThreshold: {
        global: { branches: 80, functions: 80, lines: 80, statements: 80 },
    },

    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.serverless/'],
};

export default config;
