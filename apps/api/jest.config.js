const path = require('path');

// Пытаемся зарезолвить путь к ts-jest программно
let tsJest;
try {
    tsJest = require.resolve('ts-jest');
} catch (e) {
    // Если не вышло, пробуем найти в корне монорепо
    try {
        tsJest = require.resolve('ts-jest', { paths: [path.resolve(__dirname, '../../node_modules')] });
    } catch (e2) {
        tsJest = 'ts-jest';
    }
}

/** @type {import('jest').Config} */
module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.ts$': tsJest,
    },
    collectCoverageFrom: ['**/*.ts'],
    coverageDirectory: './coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@rai/prisma-client$': path.resolve(__dirname, '../../packages/prisma-client'),
        '^@prisma/client$': path.resolve(__dirname, '../../packages/prisma-client/generated-client'),
        '^@rai/regenerative-engine$': path.resolve(__dirname, '../../packages/regenerative-engine/src'),
    },
    // Резолвинг модулей для pnpm
    moduleDirectories: [
        'node_modules',
        path.resolve(__dirname, '../../node_modules')
    ],
};
