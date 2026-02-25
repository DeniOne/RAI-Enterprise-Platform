/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/shared'],
    testMatch: ['**/*.spec.ts', '**/*.spec.tsx'],
    setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.jest.json',
            },
        ],
    },
};
