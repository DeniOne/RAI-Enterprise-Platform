"use strict";
/**
 * LLM Adapter - Phase 2.1
 *
 * СТРОГО STATELESS:
 * - НЕТ chat history
 * - НЕТ system/user/assistant ролей
 * - НЕТ chain-of-thought
 * - НЕТ памяти
 *
 * LLM — это текстовый процессор, не агент.
 *
 * Canon: AI объясняет. Человек решает.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAILLMAdapter = exports.LLMAdapterError = void 0;
exports.createLLMAdapter = createLLMAdapter;
const openai_1 = __importDefault(require("openai"));
// =============================================================================
// LLM ADAPTER ERROR
// =============================================================================
class LLMAdapterError extends Error {
    constructor(message) {
        super(message);
        this.name = 'LLMAdapterError';
    }
}
exports.LLMAdapterError = LLMAdapterError;
// =============================================================================
// OPENAI LLM ADAPTER (STATELESS)
// =============================================================================
/**
 * OpenAI LLM Adapter
 *
 * СТРОГО STATELESS:
 * - Каждый вызов generate() независим
 * - Нет сохранения контекста между вызовами
 * - Нет chat history
 */
class OpenAILLMAdapter {
    client;
    model;
    constructor(apiKey, model = 'gpt-4o') {
        const key = apiKey || process.env.OPENAI_API_KEY;
        if (!key) {
            throw new LLMAdapterError('OPENAI_API_KEY is not configured');
        }
        this.client = new openai_1.default({ apiKey: key });
        this.model = model;
    }
    /**
     * Генерация текста по промпту
     *
     * STATELESS: каждый вызов независим, нет памяти.
     *
     * @param prompt - текстовый промпт
     * @returns сгенерированный текст
     */
    async generate(prompt) {
        if (!prompt || prompt.trim().length === 0) {
            throw new LLMAdapterError('Prompt cannot be empty');
        }
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    // Единственное сообщение - prompt. Нет system, нет history.
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3, // Низкая температура для предсказуемости
                max_tokens: 2000,
            });
            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new LLMAdapterError('LLM returned empty response');
            }
            return content;
        }
        catch (error) {
            if (error instanceof LLMAdapterError) {
                throw error;
            }
            const message = error instanceof Error ? error.message : 'Unknown LLM error';
            throw new LLMAdapterError(`LLM generation failed: ${message}`);
        }
    }
}
exports.OpenAILLMAdapter = OpenAILLMAdapter;
// =============================================================================
// FACTORY
// =============================================================================
/**
 * Создать LLM Adapter
 *
 * По умолчанию использует OpenAI.
 */
function createLLMAdapter(apiKey, model) {
    return new OpenAILLMAdapter(apiKey, model);
}
