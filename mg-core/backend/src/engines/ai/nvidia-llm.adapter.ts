/**
 * Nvidia LLM Adapter - Адаптер для ебучих мощных моделей от Nvidia (Qwen и т.д.)
 * 
 * СТРОГО STATELESS:
 * - Никакой памяти, сука.
 * - Только чистый запрос-ответ.
 * 
 * Canon: ИИ объясняет. Человек решает. Nvidia тащит.
 */

import axios from 'axios';
import { ILLMAdapter } from '../../types/core/ai.types';
import { LLMAdapterError } from './llm.adapter';

export class NvidiaLLMAdapter implements ILLMAdapter {
    private readonly invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
    private readonly apiKey: string;
    private readonly model: string;

    constructor(apiKey?: string, model: string = "qwen/qwen3.5-122b-a10b") {
        // Берем ключ из пропсов или из ебучих переменных окружения
        this.apiKey = apiKey || process.env.NVIDIA_API_KEY;
        
        if (!this.apiKey) {
            throw new LLMAdapterError('NVIDIA_API_KEY не сконфигурирован, блядь. Как я работать должен?');
        }

        this.model = model;
    }

    /**
     * Генерация текста через API Nvidia.
     * 
     * @param prompt - текст запроса.
     * @returns нихера себе какой умный текст от модели.
     */
    async generate(prompt: string): Promise<string> {
        if (!prompt || prompt.trim().length === 0) {
            throw new LLMAdapterError('Промпт пустой, заебал.');
        }

        try {
            // Ебучий пэйлоад со всеми наворотами Qwen
            const payload = {
                "model": this.model,
                "messages": [{ "role": "user", "content": prompt }],
                "max_tokens": 16384,
                "temperature": 0.60,
                "top_p": 0.95,
                "chat_template_kwargs": { "enable_thinking": true } // Включаем "думалку", если модель умеет
            };

            const response = await axios.post(this.invokeUrl, payload, {
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                timeout: 120000 // Ждем 2 минуты, модели тяжелые, сука
            });

            const content = response.data?.choices?.[0]?.message?.content;

            if (!content) {
                throw new LLMAdapterError('Nvidia LLM вернула пустоту. Что-то пошло по пизде.');
            }

            return content;
        } catch (error: any) {
            const message = error.response?.data?.error?.message || error.message || 'Неизвестная ебала в Nvidia LLM';
            throw new LLMAdapterError(`Nvidia LLM генерация провалилась: ${message}`);
        }
    }
}
