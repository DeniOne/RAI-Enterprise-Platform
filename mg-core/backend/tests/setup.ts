/**
 * Jest Test Setup
 * Runs before all tests
 */

// Mock the Prisma client for all tests
jest.mock('../src/config/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        employee: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        task: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        wallet: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        transaction: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        department: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
        },
        $disconnect: jest.fn(),
    },
}));

// Suppress console.log during tests (optional)
if (process.env.SUPPRESS_LOGS === 'true') {
    global.console = {
        ...console,
        log: jest.fn(),
        debug: jest.fn(),
        info: jest.fn(),
    };
}

// Clean up after each test
afterEach(() => {
    jest.clearAllMocks();
});

// Disconnect prisma after all tests
afterAll(async () => {
    // Cleanup if needed
});
