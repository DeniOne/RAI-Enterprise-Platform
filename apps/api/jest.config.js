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
        '^.+\\.(t|j)s$': tsJest,
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: './coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@rai/prisma-client$': path.resolve(__dirname, '../../packages/prisma-client'),
    },
    // Резолвинг модулей для pnpm
    moduleDirectories: [
        'node_modules',
        path.resolve(__dirname, '../../node_modules')
    ],
};
