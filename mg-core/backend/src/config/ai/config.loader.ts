import fs from 'fs/promises';
import path from 'path';
import { logger } from '../logger';

/**
 * AI Configuration Loader
 * 
 * Loads immutable AI configuration files:
 * - constitution.md (12 Immutable Rules)
 * - system_prompt.md (LLM System Prompt)
 * - agent_card.json (Machine-readable Agent Card)
 */

export interface AgentCard {
    agent: {
        name: string;
        version: string;
        status: string;
        level: string;
        type: string;
    };
    purpose: {
        primary: string[];
        forbidden: string[];
    };
    role: {
        description: string;
        formula: string;
    };
    permissions: {
        allowed: string[];
        forbidden: string[];
    };
    behavior_principles: string[];
    failure_modes: Record<string, string>;
    trust_kpis: string[];
    ethical_anchor: string;
    identity: string;
    related_documents: string[];
}

export interface AIConfig {
    constitution: string;
    systemPrompt: string;
    agentCard: AgentCard;
}

const AI_CONFIG_DIR = path.join(__dirname);

/**
 * Load AI Configuration
 */
export async function loadAIConfig(): Promise<AIConfig> {
    try {
        const [constitution, systemPrompt, agentCardRaw] = await Promise.all([
            fs.readFile(path.join(AI_CONFIG_DIR, 'constitution.md'), 'utf-8'),
            fs.readFile(path.join(AI_CONFIG_DIR, 'system_prompt.md'), 'utf-8'),
            fs.readFile(path.join(AI_CONFIG_DIR, 'agent_card.json'), 'utf-8'),
        ]);

        const agentCard: AgentCard = JSON.parse(agentCardRaw);

        logger.info('AI Configuration loaded successfully');

        return {
            constitution,
            systemPrompt,
            agentCard,
        };
    } catch (error) {
        logger.error('Failed to load AI Configuration', { error: (error as Error).message });
        throw new Error('AI Configuration is required but could not be loaded');
    }
}

/**
 * Validate action against Constitution
 */
export function validateActionPermission(
    action: string,
    agentCard: AgentCard
): { allowed: boolean; reason?: string } {
    // Check if action is explicitly forbidden
    const isForbidden = agentCard.permissions.forbidden.some(forbidden =>
        action.toLowerCase().includes(forbidden.toLowerCase())
    );

    if (isForbidden) {
        return {
            allowed: false,
            reason: `Action "${action}" is explicitly forbidden by Constitution`,
        };
    }

    // Check if action is allowed
    const isAllowed = agentCard.permissions.allowed.some(allowed =>
        action.toLowerCase().includes(allowed.toLowerCase())
    );

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
export async function getSystemPrompt(): Promise<string> {
    const config = await loadAIConfig();
    return config.systemPrompt;
}

/**
 * Get Agent Card
 */
export async function getAgentCard(): Promise<AgentCard> {
    const config = await loadAIConfig();
    return config.agentCard;
}
