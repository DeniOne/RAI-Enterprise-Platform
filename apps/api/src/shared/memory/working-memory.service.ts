import { Injectable, Logger } from '@nestjs/common';
import { ContextService } from '../cache/context.service';

/**
 * WorkingMemoryService — L1 Reactive Memory.
 *
 * Расширение ContextService для typed Working Memory:
 * - Хранение активного контекста агента (поле, культура, фаза, техкарта).
 * - Кеш горячих энграмм (часто используемые — L4→L1 promotion).
 * - Кеш активных алертов.
 * - sub-ms latency через Redis.
 */

// --- Типы ---

export interface ActiveAgroContext {
    fieldId?: string;
    cropZoneId?: string;
    techMapId?: string;
    bbchStage?: string;
    crop?: string;
    region?: string;
}

export interface WorkingMemorySlot {
    sessionId: string;
    agentRole: string;
    currentTask?: string;
    activeContext: ActiveAgroContext;
    recentToolResults: Array<{
        toolName: string;
        resultPreview: string;
        timestamp: string;
    }>;
    updatedAt: string;
}

export interface ActiveAlert {
    id: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    type: string;
    message: string;
    fieldId?: string;
    enrichment?: string;
    timestamp: string;
}

export interface HotEngramEntry {
    engramId: string;
    compositeScore: number;
    category: string;
    contentPreview: string;
    activationCount: number;
    promotedAt: string;
}

// --- Константы TTL ---

const TTL = {
    /** Рабочая память сессии — 1 час */
    SESSION: 3600,
    /** Контекст инструмента — 15 минут */
    TOOL_CONTEXT: 900,
    /** Кеш алертов — 5 минут (обновляется monitoring) */
    ALERT_CACHE: 300,
    /** Горячие энграммы — 30 минут */
    HOT_ENGRAM: 1800,
} as const;

// --- Ключи Redis ---

function sessionKey(sessionId: string): string {
    return `wm:session:${sessionId}`;
}

function alertsKey(companyId: string): string {
    return `wm:alerts:${companyId}`;
}

function hotEngramKey(companyId: string): string {
    return `wm:hot_engrams:${companyId}`;
}

// --- Сервис ---

@Injectable()
export class WorkingMemoryService {
    private readonly logger = new Logger(WorkingMemoryService.name);

    constructor(private readonly contextService: ContextService) { }

    // ========================================================================
    // Рабочая память сессии
    // ========================================================================

    async setWorkingMemory(
        sessionId: string,
        slot: Omit<WorkingMemorySlot, 'updatedAt'>,
    ): Promise<void> {
        const data: WorkingMemorySlot = {
            ...slot,
            updatedAt: new Date().toISOString(),
        };
        await this.contextService.setContext(
            sessionKey(sessionId),
            data,
            TTL.SESSION,
        );
        this.logger.debug(
            `wm_set session=${sessionId} agent=${slot.agentRole}`,
        );
    }

    async getWorkingMemory(
        sessionId: string,
    ): Promise<WorkingMemorySlot | null> {
        return this.contextService.getContext<WorkingMemorySlot>(
            sessionKey(sessionId),
        );
    }

    async updateAgroContext(
        sessionId: string,
        patch: Partial<ActiveAgroContext>,
    ): Promise<void> {
        const current = await this.getWorkingMemory(sessionId);
        if (!current) return;

        current.activeContext = { ...current.activeContext, ...patch };
        current.updatedAt = new Date().toISOString();

        await this.contextService.setContext(
            sessionKey(sessionId),
            current,
            TTL.SESSION,
        );
    }

    async appendToolResult(
        sessionId: string,
        toolName: string,
        resultPreview: string,
    ): Promise<void> {
        const current = await this.getWorkingMemory(sessionId);
        if (!current) return;

        // Храним только последние 5 результатов
        current.recentToolResults = [
            {
                toolName,
                resultPreview: resultPreview.slice(0, 500),
                timestamp: new Date().toISOString(),
            },
            ...current.recentToolResults.slice(0, 4),
        ];
        current.updatedAt = new Date().toISOString();

        await this.contextService.setContext(
            sessionKey(sessionId),
            current,
            TTL.SESSION,
        );
    }

    // ========================================================================
    // Кеш активных алертов
    // ========================================================================

    async setActiveAlerts(
        companyId: string,
        alerts: ActiveAlert[],
    ): Promise<void> {
        await this.contextService.setContext(
            alertsKey(companyId),
            alerts,
            TTL.ALERT_CACHE,
        );
        this.logger.debug(
            `wm_alerts_set companyId=${companyId} count=${alerts.length}`,
        );
    }

    async getActiveAlerts(companyId: string): Promise<ActiveAlert[]> {
        const alerts = await this.contextService.getContext<ActiveAlert[]>(
            alertsKey(companyId),
        );
        return alerts ?? [];
    }

    async addAlert(companyId: string, alert: ActiveAlert): Promise<void> {
        const current = await this.getActiveAlerts(companyId);
        // Дедупликация по id
        const filtered = current.filter((a) => a.id !== alert.id);
        filtered.unshift(alert);
        await this.setActiveAlerts(companyId, filtered.slice(0, 20));
    }

    // ========================================================================
    // Горячий кеш энграмм (L4 → L1 promotion)
    // ========================================================================

    async promoteEngram(
        companyId: string,
        entry: HotEngramEntry,
    ): Promise<void> {
        const current = await this.getHotEngrams(companyId);
        // Дедупликация
        const filtered = current.filter((e) => e.engramId !== entry.engramId);
        filtered.unshift(entry);

        // Храним только ТОП-10 горячих энграмм
        const top = filtered
            .sort((a, b) => b.compositeScore - a.compositeScore)
            .slice(0, 10);

        await this.contextService.setContext(
            hotEngramKey(companyId),
            top,
            TTL.HOT_ENGRAM,
        );
        this.logger.debug(
            `wm_engram_promoted companyId=${companyId} engram=${entry.engramId} score=${entry.compositeScore}`,
        );
    }

    async getHotEngrams(companyId: string): Promise<HotEngramEntry[]> {
        const hot = await this.contextService.getContext<HotEngramEntry[]>(
            hotEngramKey(companyId),
        );
        return hot ?? [];
    }

    // ========================================================================
    // Полный контекст для агента
    // ========================================================================

    async getFullAgentContext(
        sessionId: string,
        companyId: string,
    ): Promise<{
        workingMemory: WorkingMemorySlot | null;
        activeAlerts: ActiveAlert[];
        hotEngrams: HotEngramEntry[];
    }> {
        const [workingMemory, activeAlerts, hotEngrams] = await Promise.all([
            this.getWorkingMemory(sessionId),
            this.getActiveAlerts(companyId),
            this.getHotEngrams(companyId),
        ]);

        return { workingMemory, activeAlerts, hotEngrams };
    }
}
