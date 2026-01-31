"use strict";
/**
 * PSEE Integration Service
 *
 * Initialize and manage PSEE event consumer.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePsee = initializePsee;
exports.shutdownPsee = shutdownPsee;
exports.getPseeReadModel = getPseeReadModel;
exports.getPseeConsumer = getPseeConsumer;
const index_1 = require("./index");
const logger_1 = require("@/config/logger");
let consumer = null;
let readModel = null;
/**
 * Initialize PSEE integration.
 * Call this during app startup.
 */
async function initializePsee(prisma) {
    if (consumer) {
        logger_1.logger.warn('PSEE already initialized');
        return;
    }
    const reader = new index_1.PseeEventReader(prisma);
    readModel = new index_1.PseeReadModel();
    consumer = new index_1.PseeEventConsumer(reader, async (events) => {
        await readModel.processEvents(events);
    }, Number(process.env.PSEE_POLL_INTERVAL_MS) || 5000);
    await consumer.start();
    logger_1.logger.info('PSEE integration initialized');
}
/**
 * Shutdown PSEE integration.
 */
function shutdownPsee() {
    if (consumer) {
        consumer.stop();
        consumer = null;
    }
    readModel = null;
    logger_1.logger.info('PSEE integration shutdown');
}
/**
 * Get PSEE read model (for AI / analytics).
 */
function getPseeReadModel() {
    return readModel;
}
/**
 * Get PSEE consumer (for monitoring).
 */
function getPseeConsumer() {
    return consumer;
}
