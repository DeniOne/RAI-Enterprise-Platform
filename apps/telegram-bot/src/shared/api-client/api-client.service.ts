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
}

