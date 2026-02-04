import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiClientService {
    private readonly backendUrl: string;
    private readonly apiKey: string;

    constructor(private configService: ConfigService) {
        this.backendUrl = this.configService.get<string>('BACKEND_URL') || 'http://localhost:4000';
        this.apiKey = this.configService.get<string>('INTERNAL_API_KEY') || '';
    }

    async confirmLogin(sessionId: string): Promise<{ accessToken: string }> {
        try {
            const response = await fetch(`${this.backendUrl}/internal/telegram/confirm-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-API-Key': this.apiKey,
                },
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
                headers: {
                    'Content-Type': 'application/json',
                    'X-Internal-API-Key': this.apiKey,
                },
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
}
