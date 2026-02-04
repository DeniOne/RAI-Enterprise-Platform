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

    constructor(private configService: ConfigService) {
        this.backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:4000';
        this.apiKey = this.configService.get<string>('INTERNAL_API_KEY') || '';
    }

    private getHeaders(accessToken?: string): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Internal-API-Key': this.apiKey,
        };
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return headers;
    }

    async confirmLogin(sessionId: string): Promise<{ accessToken: string }> {
        try {
            const response = await fetch(`${this.backendUrl}/internal/telegram/confirm-login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ sessionId }),
            });

            if (!response.ok) {
                throw new HttpException('Failed to confirm login', response.status);
            }

            return response.json();
        } catch (error) {
            console.error('Error confirming login:', error);
            throw error;
        }
    }

    async denyLogin(sessionId: string): Promise<void> {
        try {
            const response = await fetch(`${this.backendUrl}/internal/telegram/deny-login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ sessionId }),
            });

            if (!response.ok) {
                throw new HttpException('Failed to deny login', response.status);
            }
        } catch (error) {
            console.error('Error denying login:', error);
            throw error;
        }
    }

    /**
     * Get tasks for a user (via internal API with user context)
     */
    async getMyTasks(accessToken: string): Promise<TaskDto[]> {
        try {
            const response = await fetch(`${this.backendUrl}/tasks/my`, {
                method: 'GET',
                headers: this.getHeaders(accessToken),
            });

            if (!response.ok) {
                throw new HttpException('Failed to get tasks', response.status);
            }

            return response.json();
        } catch (error) {
            console.error('Error getting tasks:', error);
            throw error;
        }
    }

    /**
     * Start a task
     */
    async startTask(taskId: string, accessToken: string): Promise<TaskDto> {
        try {
            const response = await fetch(`${this.backendUrl}/tasks/${taskId}/start`, {
                method: 'POST',
                headers: this.getHeaders(accessToken),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new HttpException(error.message || 'Failed to start task', response.status);
            }

            return response.json();
        } catch (error) {
            console.error('Error starting task:', error);
            throw error;
        }
    }

    /**
     * Complete a task
     */
    async completeTask(taskId: string, accessToken: string, actuals?: any[]): Promise<TaskDto> {
        try {
            const response = await fetch(`${this.backendUrl}/tasks/${taskId}/complete`, {
                method: 'POST',
                headers: this.getHeaders(accessToken),
                body: JSON.stringify({ actuals: actuals || [] }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new HttpException(error.message || 'Failed to complete task', response.status);
            }

            return response.json();
        } catch (error) {
            console.error('Error completing task:', error);
            throw error;
        }
    }
}

