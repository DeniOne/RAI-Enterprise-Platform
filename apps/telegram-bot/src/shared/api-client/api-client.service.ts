import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TaskDto {
    id: string;
    name: string;
    status: string;
    fieldId: string;
    seasonId: string;
    plannedDate?: string;
    field?: { id: string; name: string };
    season?: { id: string; year: number };
}

export interface AdvisoryRecommendationDto {
    traceId: string;
    signalType: 'VISION' | 'SATELLITE' | 'OPERATION';
    recommendation: 'ALLOW' | 'REVIEW' | 'BLOCK';
    confidence: number;
    explainability: {
        traceId: string;
        confidence: number;
        why: string;
        factors: Array<{
            name: string;
            value: number;
            direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
        }>;
    };
    createdAt: string;
    status: 'PENDING';
}

export interface AdvisoryPilotStatusDto {
    enabled: boolean;
    scope: 'COMPANY' | 'USER';
    companyId: string;
    userId?: string;
    updatedAt?: string;
}

export interface AdvisoryRolloutStatusDto {
    stage: 'S0' | 'S1' | 'S2' | 'S3' | 'S4';
    percentage: number;
    autoStopEnabled: boolean;
    updatedAt?: string;
}

export interface AgroDraftResponseDto {
    draft: {
        id: string;
        status: 'DRAFT' | 'READY_FOR_CONFIRM' | 'COMMITTED';
        missingMust?: string[];
        payload?: Record<string, any>;
        evidence?: any[];
    };
    committed?: {
        id: string;
        provenanceHash?: string;
    };
    ui?: {
        message?: string;
        buttons?: string[];
    };
}

export interface FrontOfficeDraftResponseDto {
    status: 'DRAFT_RECORDED' | 'COMMITTED';
    confirmationRequired: boolean;
    draftId: string;
    resolutionMode?: 'AUTO_REPLY' | 'REQUEST_CLARIFICATION' | 'PROCESS_DRAFT' | 'HUMAN_HANDOFF' | null;
    responseRisk?: 'SAFE_INFORMATIONAL' | 'RESPONSIBLE_ACTION' | 'INSUFFICIENT_CONTEXT' | 'OPERATIONAL_SIGNAL' | 'ESCALATION_SIGNAL' | null;
    replyStatus?: 'NOT_SENT' | 'SENT' | 'SKIPPED' | 'FAILED';
    prohibitedReason?: string | null;
    autoReplyTraceId?: string | null;
    managerNotified?: boolean;
    targetOwnerRole?: string | null;
    handoffId?: string | null;
    handoffStatus?: string | null;
    ownerResultRef?: string | null;
    threadKey?: string | null;
    classification?: {
        classification?: string | null;
        confidence?: number | null;
        targetOwnerRole?: string | null;
        threadKey?: string | null;
    };
    suggestedIntent?: 'observation' | 'deviation' | 'consultation' | 'context_update';
    anchor?: {
        farmRef?: string | null;
        fieldId?: string | null;
        seasonId?: string | null;
        taskId?: string | null;
    };
    mustClarifications?: string[];
    allowedActions?: string[];
    draft?: {
        id: string;
        status: string;
        payload?: Record<string, any>;
        mustClarifications?: string[];
    };
    committed?: {
        id: string;
        eventType?: string;
        committedAt?: string;
    } | null;
    commitResult?: {
        kind?: string;
        id?: string;
    } | null;
}

@Injectable()
export class ApiClientService {
    private readonly backendUrl: string;
    private readonly apiKey: string;

    // Resilience state
    private failureCount = 0;
    private lastFailureTime = 0;
    private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
    private readonly CIRCUIT_BREAKER_COOLDOWN = 30000; // 30s
    private readonly MAX_RETRIES = 3;

    constructor(private configService: ConfigService) {
        this.backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:4000';
        this.apiKey = this.configService.get<string>('INTERNAL_API_KEY') || '';
    }

    private getHeaders(accessToken?: string, idempotencyKey?: string): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Internal-API-Key': this.apiKey,
        };
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        if (idempotencyKey) {
            headers['X-Idempotency-Key'] = idempotencyKey;
        }
        return headers;
    }

    /**
     * Generic request wrapper with Retries and Circuit Breaker.
     */
    private async request<T>(
        path: string,
        options: RequestInit,
        retries = this.MAX_RETRIES
    ): Promise<T> {
        // 1. Check Circuit Breaker
        if (this.failureCount >= this.CIRCUIT_BREAKER_THRESHOLD) {
            const now = Date.now();
            if (now - this.lastFailureTime < this.CIRCUIT_BREAKER_COOLDOWN) {
                console.warn(`[ApiClient] Circuit breaker is OPEN. Fast failing request to ${path}`);
                throw new HttpException('Сервис временно недоступен (Circuit Breaker)', HttpStatus.SERVICE_UNAVAILABLE);
            } else {
                // Reset after cooldown
                this.failureCount = 0;
                console.log(`[ApiClient] Circuit breaker HALF-OPEN. Attempting request to ${path}`);
            }
        }

        let lastError: any;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s...
                    console.log(`[ApiClient] Retry ${attempt}/${retries} for ${path} after ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                const response = await fetch(`${this.backendUrl}${path}`, options);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const status = response.status;

                    // Don't retry 4xx errors (except 429)
                    if (status >= 400 && status < 500 && status !== 429) {
                        throw new HttpException(errorData.message || 'API Error', status);
                    }

                    throw new Error(`HTTP ${status}: ${JSON.stringify(errorData)}`);
                }

                // Success!
                this.failureCount = 0;
                return response.json();

            } catch (error) {
                lastError = error;
                if (error instanceof HttpException) throw error; // Re-throw client errors

                console.error(`[ApiClient] Attempt ${attempt} failed:`, error.message);

                // Track failures for Circuit Breaker
                this.failureCount++;
                this.lastFailureTime = Date.now();
            }
        }

        throw lastError;
    }

    /**
     * Deterministic idempotency key generator
     */
    private _generateIdempotencyKey(operation: string, payload: any): string {
        const bodyStr = payload ? JSON.stringify(payload) : '';
        // Simple deterministic "hash" for demo (in production use crypto.createHash)
        return Buffer.from(`${operation}:${bodyStr}`).toString('base64').substring(0, 32);
    }

    async confirmLogin(sessionId: string): Promise<{ accessToken: string }> {
        return this.request('/api/internal/telegram/confirm-login', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ sessionId }),
        });
    }

    async denyLogin(sessionId: string): Promise<void> {
        return this.request('/api/internal/telegram/deny-login', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ sessionId }),
        });
    }

    /**
     * User Management
     */
    async getUser(telegramId: string): Promise<any> {
        return this.request('/api/internal/telegram/user/get', {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ telegramId }),
        });
    }

    async upsertUser(data: any): Promise<any> {
        const idempotencyKey = this._generateIdempotencyKey('upsertUser', data);
        return this.request('/api/internal/telegram/user/upsert', {
            method: 'POST',
            headers: this.getHeaders(undefined, idempotencyKey),
            body: JSON.stringify(data),
        });
    }

    async getFirstCompany(): Promise<any> {
        return this.request('/api/internal/telegram/company/first', {
            method: 'POST',
            headers: this.getHeaders(),
        });
    }

    async getActiveUsers(): Promise<any[]> {
        return this.request('/api/internal/telegram/users/active', {
            method: 'POST',
            headers: this.getHeaders(),
        });
    }

    /**
     * Task Management
     */
    async getMyTasks(accessToken: string): Promise<TaskDto[]> {
        return this.request('/api/tasks/my', {
            method: 'GET',
            headers: this.getHeaders(accessToken),
        });
    }

    async startTask(taskId: string, accessToken: string): Promise<TaskDto> {
        const idempotencyKey = `start_task:${taskId}`;
        return this.request(`/api/tasks/${taskId}/start`, {
            method: 'POST',
            headers: this.getHeaders(accessToken, idempotencyKey),
        });
    }

    async completeTask(taskId: string, accessToken: string, actuals?: any[]): Promise<TaskDto> {
        const idempotencyKey = `complete_task:${taskId}`;
        return this.request(`/api/tasks/${taskId}/complete`, {
            method: 'POST',
            headers: this.getHeaders(accessToken, idempotencyKey),
            body: JSON.stringify({ actuals: actuals || [] }),
        });
    }

    async getTechMapBySeason(seasonId: string, accessToken: string): Promise<any> {
        return this.request(`/api/tech-map/season/${seasonId}`, {
            method: 'GET',
            headers: this.getHeaders(accessToken),
        });
    }

    /**
     * HR Pulse Surveys
     */
    async getPulseSurveys(accessToken: string): Promise<any[]> {
        return this.request('/api/hr/pulse/surveys', {
            method: 'GET',
            headers: this.getHeaders(accessToken),
        });
    }

    async submitPulseResponse(data: { pulseSurveyId: string; respondentId: string; answers: any; employeeId: string }, accessToken: string): Promise<any> {
        return this.request('/api/hr/pulse/submit', {
            method: 'POST',
            headers: this.getHeaders(accessToken),
            body: JSON.stringify(data),
        });
    }

    async createObservation(data: any, accessToken: string): Promise<any> {
        return this.request('/api/field-observation', {
            method: 'POST',
            headers: this.getHeaders(accessToken),
            body: JSON.stringify(data),
        });
    }

    async getFrontOfficeOverview(accessToken: string): Promise<any> {
        return this.request('/api/front-office/overview', {
            method: 'GET',
            headers: this.getHeaders(accessToken),
        });
    }

    async getFrontOfficeDeviations(accessToken: string): Promise<any> {
        return this.request('/api/front-office/deviations', {
            method: 'GET',
            headers: this.getHeaders(accessToken),
        });
    }

    async createFrontOfficeDraft(data: any, accessToken: string): Promise<FrontOfficeDraftResponseDto> {
        const idempotencyKey = this._generateIdempotencyKey('createFrontOfficeDraft', data);
        return this.request('/api/front-office/intake/message', {
            method: 'POST',
            headers: this.getHeaders(accessToken, idempotencyKey),
            body: JSON.stringify(data),
        });
    }

    async getFrontOfficeDraft(draftId: string, accessToken: string): Promise<FrontOfficeDraftResponseDto> {
        return this.request(`/api/front-office/drafts/${draftId}`, {
            method: 'GET',
            headers: this.getHeaders(accessToken),
        });
    }

    async fixFrontOfficeDraft(
        draftId: string,
        patch: Record<string, any>,
        accessToken: string,
    ): Promise<FrontOfficeDraftResponseDto> {
        const idempotencyKey = this._generateIdempotencyKey('fixFrontOfficeDraft', { draftId, patch });
        return this.request(`/api/front-office/drafts/${draftId}/fix`, {
            method: 'POST',
            headers: this.getHeaders(accessToken, idempotencyKey),
            body: JSON.stringify(patch),
        });
    }

    async linkFrontOfficeDraft(
        draftId: string,
        link: { taskId?: string; fieldId?: string; seasonId?: string; farmRef?: string },
        accessToken: string,
    ): Promise<FrontOfficeDraftResponseDto> {
        const idempotencyKey = this._generateIdempotencyKey('linkFrontOfficeDraft', { draftId, link });
        return this.request(`/api/front-office/drafts/${draftId}/link`, {
            method: 'POST',
            headers: this.getHeaders(accessToken, idempotencyKey),
            body: JSON.stringify(link),
        });
    }

    async confirmFrontOfficeDraft(
        draftId: string,
        accessToken: string,
    ): Promise<FrontOfficeDraftResponseDto> {
        const idempotencyKey = `confirmFrontOfficeDraft:${draftId}`;
        return this.request(`/api/front-office/drafts/${draftId}/confirm`, {
            method: 'POST',
            headers: this.getHeaders(accessToken, idempotencyKey),
        });
    }

    async createAgroEventDraft(data: any, accessToken: string): Promise<AgroDraftResponseDto> {
        const idempotencyKey = this._generateIdempotencyKey('createAgroEventDraft', data);
        return this.request('/api/agro-events/drafts', {
            method: 'POST',
            headers: this.getHeaders(accessToken, idempotencyKey),
            body: JSON.stringify(data),
        });
    }

    async fixAgroEventDraft(data: { draftId: string; patch: Record<string, any> }, accessToken: string): Promise<AgroDraftResponseDto> {
        const idempotencyKey = this._generateIdempotencyKey('fixAgroEventDraft', data);
        return this.request('/api/agro-events/fix', {
            method: 'POST',
            headers: this.getHeaders(accessToken, idempotencyKey),
            body: JSON.stringify(data),
        });
    }

    async linkAgroEventDraft(data: { draftId: string; farmRef?: string; fieldRef?: string; taskRef?: string }, accessToken: string): Promise<AgroDraftResponseDto> {
        const idempotencyKey = this._generateIdempotencyKey('linkAgroEventDraft', data);
        return this.request('/api/agro-events/link', {
            method: 'POST',
            headers: this.getHeaders(accessToken, idempotencyKey),
            body: JSON.stringify(data),
        });
    }

    async confirmAgroEventDraft(draftId: string, accessToken: string): Promise<AgroDraftResponseDto> {
        const idempotencyKey = `confirmAgroEventDraft:${draftId}`;
        return this.request('/api/agro-events/confirm', {
            method: 'POST',
            headers: this.getHeaders(accessToken, idempotencyKey),
            body: JSON.stringify({ draftId }),
        });
    }

    /**
     * Advisory recommendations (Sprint 4)
     */
    async getMyAdvisoryRecommendations(accessToken: string): Promise<AdvisoryRecommendationDto[]> {
        return this.request('/api/advisory/recommendations/my?limit=10', {
            method: 'GET',
            headers: this.getHeaders(accessToken),
        });
    }

    async getAdvisoryPilotStatus(accessToken: string): Promise<AdvisoryPilotStatusDto> {
        return this.request('/api/advisory/pilot/status', {
            method: 'GET',
            headers: this.getHeaders(accessToken),
        });
    }

    async getAdvisoryRolloutStatus(accessToken: string): Promise<AdvisoryRolloutStatusDto> {
        return this.request('/api/advisory/rollout/status', {
            method: 'GET',
            headers: this.getHeaders(accessToken),
        });
    }

    async acceptAdvisory(traceId: string, accessToken: string): Promise<{ traceId: string; status: 'ACCEPTED' }> {
        const idempotencyKey = `accept_advisory:${traceId}`;
        return this.request(`/api/advisory/recommendations/${traceId}/accept`, {
            method: 'POST',
            headers: this.getHeaders(accessToken, idempotencyKey),
        });
    }

    async rejectAdvisory(
        traceId: string,
        accessToken: string,
        reason?: string,
    ): Promise<{ traceId: string; status: 'REJECTED' }> {
        const idempotencyKey = `reject_advisory:${traceId}`;
        return this.request(`/api/advisory/recommendations/${traceId}/reject`, {
            method: 'POST',
            headers: this.getHeaders(accessToken, idempotencyKey),
            body: JSON.stringify(reason ? { reason } : {}),
        });
    }

    async recordAdvisoryFeedback(
        traceId: string,
        payload: { reason: string; outcome?: string },
        accessToken: string,
    ): Promise<{ traceId: string; status: 'RECORDED' }> {
        const idempotencyKey = `feedback_advisory:${traceId}:${payload.reason}`;
        return this.request(`/api/advisory/recommendations/${traceId}/feedback`, {
            method: 'POST',
            headers: this.getHeaders(accessToken, idempotencyKey),
            body: JSON.stringify(payload),
        });
    }
}
