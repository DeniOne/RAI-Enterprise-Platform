"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const path_1 = __importDefault(require("path"));
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const passport_2 = require("./config/passport");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const employee_registration_routes_1 = __importDefault(require("./routes/employee-registration.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const ofs_routes_1 = __importDefault(require("./routes/ofs.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const economy_routes_1 = __importDefault(require("./routes/economy.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const telegram_routes_1 = __importDefault(require("./routes/telegram.routes"));
const telegram_service_1 = __importDefault(require("./services/telegram.service"));
const audit_log_middleware_1 = require("./middleware/audit-log.middleware");
const mvp_learning_contour_middleware_1 = require("./middleware/mvp-learning-contour.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const logger_1 = require("./config/logger");
const swagger_1 = require("./config/swagger");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const gamification_routes_1 = __importDefault(require("./routes/gamification.routes"));
const university_routes_1 = __importDefault(require("./routes/university.routes"));
const production_routes_1 = __importDefault(require("./routes/production.routes"));
const mes_routes_1 = __importDefault(require("./mes/mes.routes"));
const registry_routes_1 = __importDefault(require("./registry/registry.routes"));
const cache_1 = require("./config/cache");
const core_1 = require("./registry/core");
const entity_cards_1 = require("./entity-cards");
const graph_routes_1 = __importDefault(require("./graph/graph.routes"));
const impact_routes_1 = __importDefault(require("./impact/impact.routes"));
const ai_ops_routes_1 = __importDefault(require("./ai-ops/ai-ops.routes"));
const adaptation_routes_1 = __importDefault(require("./routes/adaptation.routes"));
const manager_tools_routes_1 = __importDefault(require("./routes/manager-tools.routes"));
const status_routes_1 = __importDefault(require("./routes/status.routes"));
const foundation_routes_1 = __importDefault(require("./routes/foundation.routes"));
const university_event_dispatcher_1 = require("./events/university-event.dispatcher");
// Handle BigInt serialization
BigInt.prototype.toJSON = function () {
    return this.toString();
};
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Security Middleware
app.use((0, helmet_1.default)());
// CORS Configuration
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
// Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({ message: options.message });
    },
    message: 'Too many requests from this IP, please try again later.'
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({ message: options.message });
    },
    message: 'Too many authentication attempts, please try again later.'
});
const telegramLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({ message: options.message });
    },
    message: 'Too many Telegram updates from this IP.'
});
app.use(limiter);
app.use('/api/telegram/webhook', telegramLimiter);
app.use(audit_log_middleware_1.auditLogMiddleware);
// Middleware
app.use(express_1.default.json());
app.use('/content', express_1.default.static(path_1.default.join(__dirname, '../../content')));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
app.use(passport_1.default.initialize());
passport_1.default.use(passport_2.jwtStrategy);
// Routes
// Swagger Documentation
app.use('/api/docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MatrixGin API Docs',
}));
// API Routes
app.use('/api/auth', authLimiter, auth_routes_1.default);
app.use('/api/employees', employee_routes_1.default);
app.use('/api/registration', employee_registration_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/ofs', ofs_routes_1.default);
app.use('/api/tasks', task_routes_1.default);
app.use('/api/economy', economy_routes_1.default);
app.use('/api/analytics', mvp_learning_contour_middleware_1.mvpLearningContourMiddleware, analytics_routes_1.default);
app.use('/api/store', mvp_learning_contour_middleware_1.mvpLearningContourMiddleware);
app.use('/api/economy/analytics', mvp_learning_contour_middleware_1.mvpLearningContourMiddleware);
app.use('/api/economy/auction', mvp_learning_contour_middleware_1.mvpLearningContourMiddleware);
app.use('/economy/analytics', mvp_learning_contour_middleware_1.mvpLearningContourMiddleware);
app.use('/economy/auction', mvp_learning_contour_middleware_1.mvpLearningContourMiddleware);
app.use('/api/telegram', telegram_routes_1.default);
app.use('/api/gamification', gamification_routes_1.default);
app.use('/api/university', university_routes_1.default);
app.use('/api/production', production_routes_1.default);
app.use('/api/mes', mes_routes_1.default);
app.use('/api/registry', registry_routes_1.default);
app.use('/api/entity-cards', entity_cards_1.entityCardRoutes);
app.use('/api/graph', graph_routes_1.default);
app.use('/api/impact', impact_routes_1.default);
app.use('/api/ai-ops', ai_ops_routes_1.default);
app.use('/api/adaptation', adaptation_routes_1.default);
app.use('/api/manager', manager_tools_routes_1.default);
app.use('/api/status', status_routes_1.default);
app.use('/api/foundation', foundation_routes_1.default);
app.get('/', (req, res) => {
    res.send('MatrixGin v2.0 API');
});
// Error Handling (must be after all routes)
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
// =============================================================================
// ASYNC STARTUP - Registry Bootstrap MUST succeed before server starts
// =============================================================================
async function startServer() {
    try {
        // 1. Bootstrap Registry (CRITICAL - fail-fast)
        logger_1.logger.info('=== STARTING MATRIXGIN SERVER ===');
        await (0, core_1.bootstrapRegistry)();
        // 2. Initialize Entity Cards (CRITICAL - depends on Registry)
        entity_cards_1.entityCardService.initialize();
        // 3. Initialize Telegram Bot (non-critical)
        telegram_service_1.default.initializeBot().catch(error => {
            logger_1.logger.error('Failed to initialize Telegram bot', { error: error.message });
        });
        // 4. Initialize Redis cache (non-critical)
        cache_1.cache.connect().catch(error => {
            logger_1.logger.warn('Redis not available, caching disabled', { error: error.message });
        });
        // 4.1 Start University Event Worker (Module 13)
        university_event_dispatcher_1.universityEventDispatcher.startWorker();
        // 5. Start HTTP server
        app.listen(port, () => {
            logger_1.logger.info(`Server is running at http://localhost:${port}`);
        });
    }
    catch (error) {
        // Registry bootstrap failed - EXIT IMMEDIATELY
        logger_1.logger.error('=== SERVER STARTUP FAILED ===');
        logger_1.logger.error(`Critical error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
startServer();
