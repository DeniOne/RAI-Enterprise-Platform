import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import 'reflect-metadata';
import express from 'express';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { jwtStrategy } from './config/passport';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import employeeRegistrationRoutes from './routes/employee-registration.routes';
import departmentRoutes from './routes/department.routes';
import ofsRoutes from './routes/ofs.routes';
import taskRoutes from './routes/task.routes';
import economyRoutes from './routes/economy.routes';
import analyticsRoutes from './routes/analytics.routes';
import telegramRoutes from './routes/telegram.routes';
import telegramService from './services/telegram.service';
import { auditLogMiddleware } from './middleware/audit-log.middleware';
import { mvpLearningContourMiddleware } from './middleware/mvp-learning-contour.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { logger } from './config/logger';
import { swaggerSpec } from './config/swagger';
import swaggerUi from 'swagger-ui-express';

import gamificationRoutes from './routes/gamification.routes';
import universityRoutes from './routes/university.routes';
import productionRoutes from './routes/production.routes';
import mesRoutes from './mes/mes.routes';
import registryRoutes from './registry/registry.routes';
import { cache } from './config/cache';
import { bootstrapRegistry } from './registry/core';
import { entityCardService, entityCardRoutes } from './entity-cards';
import graphRoutes from './graph/graph.routes';
import impactRoutes from './impact/impact.routes';
import aiOpsRoutes from './ai-ops/ai-ops.routes';
import adaptationRoutes from './routes/adaptation.routes';
import managerToolsRoutes from './routes/manager-tools.routes';
import statusRoutes from './routes/status.routes';
import foundationRoutes from './routes/foundation.routes';
import { universityEventDispatcher } from './events/university-event.dispatcher';


// Handle BigInt serialization
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const app = express();
const port = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

// CORS Configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // INCREASED FOR DEV
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({ message: options.message });
    },
    message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // INCREASED FOR DEV
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({ message: options.message });
    },
    message: 'Too many authentication attempts, please try again later.'
});

const telegramLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json({ message: options.message });
    },
    message: 'Too many Telegram updates from this IP.'
});

app.use(limiter);
app.use('/api/telegram/webhook', telegramLimiter);
app.use(auditLogMiddleware);

// Middleware
app.use(express.json());
app.use('/content', express.static(path.join(__dirname, '../../content')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(passport.initialize());
passport.use(jwtStrategy);

// Routes
// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MatrixGin API Docs',
}));

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/registration', employeeRegistrationRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/ofs', ofsRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/analytics', mvpLearningContourMiddleware, analyticsRoutes);
app.use('/api/store', mvpLearningContourMiddleware);
app.use('/api/economy/analytics', mvpLearningContourMiddleware);
app.use('/api/economy/auction', mvpLearningContourMiddleware);
app.use('/economy/analytics', mvpLearningContourMiddleware);
app.use('/economy/auction', mvpLearningContourMiddleware);
app.use('/api/telegram', telegramRoutes);

app.use('/api/gamification', gamificationRoutes);
app.use('/api/university', universityRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/mes', mesRoutes);
app.use('/api/registry', registryRoutes);
app.use('/api/entity-cards', entityCardRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/ai-ops', aiOpsRoutes);
app.use('/api/adaptation', adaptationRoutes);
app.use('/api/manager', managerToolsRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/foundation', foundationRoutes);

app.get('/', (req, res) => {
    res.send('MatrixGin v2.0 API');
});

// Error Handling (must be after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

// =============================================================================
// ASYNC STARTUP - Registry Bootstrap MUST succeed before server starts
// =============================================================================

async function startServer() {
    try {
        // 1. Bootstrap Registry (CRITICAL - fail-fast)
        logger.info('=== STARTING MATRIXGIN SERVER ===');
        await bootstrapRegistry();

        // 2. Initialize Entity Cards (CRITICAL - depends on Registry)
        entityCardService.initialize();

        // 3. Initialize Telegram Bot (non-critical)
        telegramService.initializeBot().catch(error => {
            logger.error('Failed to initialize Telegram bot', { error: error.message });
        });

        // 4. Initialize Redis cache (non-critical)
        cache.connect().catch(error => {
            logger.warn('Redis not available, caching disabled', { error: error.message });
        });

        // 4.1 Start University Event Worker (Module 13)
        universityEventDispatcher.startWorker();

        // 5. Start HTTP server
        app.listen(port, () => {
            logger.info(`Server is running at http://localhost:${port}`);
        });

    } catch (error) {
        // Registry bootstrap failed - EXIT IMMEDIATELY
        logger.error('=== SERVER STARTUP FAILED ===');
        logger.error(`Critical error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

startServer();

