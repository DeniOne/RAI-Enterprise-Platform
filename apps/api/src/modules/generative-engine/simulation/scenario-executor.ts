import { Injectable, Logger } from '@nestjs/common';
import type { GeneratedDraft } from '../domain/draft-factory';

/**
 * ScenarioExecutor — Исполнитель сценариев симуляции (I22).
 * 
 * Запускает "что-если" сценарии на основе GeneratedDraft.
 * Детерминированно применяет изменения к черновику и рассчитывает результат.
 */
@Injectable()
export class ScenarioExecutor {
    private readonly logger = new Logger(ScenarioExecutor.name);

    /**
     * Применяет сценарий к черновику.
     * @param draft - исходный черновик
     * @param modifications - список изменений (например, [ { op: 'replace', path: 'stages.0', value: ... } ])
     * @returns Новый измененный черновик (in-memory)
     */
    applyScenario(draft: GeneratedDraft, modifications: any[]): GeneratedDraft {
        this.logger.debug(`Applying scenario with ${modifications.length} modifications`);

        // Клон черновика для изоляции
        const simulationDraft = JSON.parse(JSON.stringify(draft));

        for (const mod of modifications) {
            // Упрощенная реализация: поддержка только замены значений по пути
            // В реальности нужен json-patch или аналоги
            if (mod.op === 'replace' && mod.path === 'moisture') {
                simulationDraft.moisture = mod.value;
            }
            // Другие модификации...
        }

        return simulationDraft;
    }
}
