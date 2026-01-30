"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAIConfig = loadAIConfig;
exports.validateActionPermission = validateActionPermission;
exports.getSystemPrompt = getSystemPrompt;
exports.getAgentCard = getAgentCard;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../logger");
const AI_CONFIG_DIR = path_1.default.join(__dirname);
/**
 * Load AI Configuration
 */
async function loadAIConfig() {
    try {
        const [constitution, systemPrompt, agentCardRaw] = await Promise.all([
            promises_1.default.readFile(path_1.default.join(AI_CONFIG_DIR, 'constitution.md'), 'utf-8'),
            promises_1.default.readFile(path_1.default.join(AI_CONFIG_DIR, 'system_prompt.md'), 'utf-8'),
            promises_1.default.readFile(path_1.default.join(AI_CONFIG_DIR, 'agent_card.json'), 'utf-8'),
        ]);
        const agentCard = JSON.parse(agentCardRaw);
        logger_1.logger.info('AI Configuration loaded successfully');
        return {
            constitution,
            systemPrompt,
            agentCard,
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to load AI Configuration', { error: error.message });
        throw new Error('AI Configuration is required but could not be loaded');
    }
}
/**
 * Validate action against Constitution
 */
function validateActionPermission(action, agentCard) {
    // Check if action is explicitly forbidden
    const isForbidden = agentCard.permissions.forbidden.some(forbidden => action.toLowerCase().includes(forbidden.toLowerCase()));
    if (isForbidden) {
        return {
            allowed: false,
            reason: `Action "${action}" is explicitly forbidden by Constitution`,
        };
    }
    // Check if action is allowed
    const isAllowed = agentCard.permissions.allowed.some(allowed => action.toLowerCase().includes(allowed.toLowerCase()));
    if (!isAllowed) {
        return {
            allowed: false,
            reason: `Action "${action}" is not in the list of allowed permissions`,
        };
    }
    return { allowed: true };
}
/**
 * Get System Prompt for LLM
 */
async function getSystemPrompt() {
    const config = await loadAIConfig();
    return config.systemPrompt;
}
/**
 * Get Agent Card
 */
async function getAgentCard() {
    const config = await loadAIConfig();
    return config.agentCard;
}
