import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI Configuration
 * 
 * Documentation available at: /api/docs
 */

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MatrixGin API',
            version: '2.0.0',
            description: `
## MatrixGin — корпоративная ERP-платформа

Полнофункциональный API для управления:
- 👥 Организационной структурой (OFS)
- ✅ Задачами и KPI
- 🎓 Корпоративным университетом
- 🎮 Геймификацией и экономикой MatrixCoin
- 🤖 Telegram-ботом

### Аутентификация
Используйте JWT токен в заголовке Authorization:
\`Authorization: Bearer <token>\`
            `,
            contact: {
                name: 'MatrixGin Support',
                email: 'support@matrixgin.com',
            },
            license: {
                name: 'Proprietary',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
            {
                url: 'https://api.matrixgin.com',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token from /api/auth/login',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'string', example: 'VALIDATION_ERROR' },
                                message: { type: 'string', example: 'Validation failed' },
                            },
                        },
                        meta: {
                            type: 'object',
                            properties: {
                                timestamp: { type: 'string', format: 'date-time' },
                                path: { type: 'string' },
                            },
                        },
                    },
                },
                Pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 20 },
                        total: { type: 'integer', example: 100 },
                        totalPages: { type: 'integer', example: 5 },
                    },
                },
            },
        },
        security: [{ bearerAuth: [] }],
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Employees', description: 'Employee management' },
            { name: 'Departments', description: 'Department management' },
            { name: 'OFS', description: 'Organizational structure' },
            { name: 'Tasks', description: 'Task management' },
            { name: 'Economy', description: 'MatrixCoin economy' },
            { name: 'Gamification', description: 'Gamification system' },
            { name: 'Store', description: 'MatrixCoin store' },
            { name: 'University', description: 'Corporate university' },
            { name: 'Analytics', description: 'HR analytics' },
            { name: 'Telegram', description: 'Telegram bot integration' },
        ],
    },
    apis: [
        './src/routes/*.ts',
        './src/dto/**/*.ts',
    ],
};

export const swaggerSpec = swaggerJsdoc(options);
