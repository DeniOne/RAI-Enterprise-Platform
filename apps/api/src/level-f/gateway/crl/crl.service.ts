import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../shared/redis/redis.service';

/**
 * Certificate Revocation List (CRL) Lifecycle 
 * Фаза 5: Контроль отозванных сертификатов через Redis Bloom Filter.
 */
@Injectable()
export class CrlService {
    private readonly logger = new Logger(CrlService.name);
    private readonly BLOOM_KEY = 'crl:bloom:certificates';

    constructor(private readonly redisService: RedisService) { }

    /**
     * Инициализация Bloom фильтра, если его нет (требует модуль RedisBloom)
     */
    async onModuleInit() {
        const client = this.redisService.getClient();
        if (client.status === 'ready') {
            try {
                // Reserve bloom filter space for 1 Million certs with 0.01 error rate
                await client.call('BF.RESERVE', this.BLOOM_KEY, '0.01', '1000000');
                this.logger.log(`Initialized Redis Bloom Filter for CRL: ${this.BLOOM_KEY}`);
            } catch (err) {
                // If it already exists, RedisBloom will throw ERR item exists
                if (!err.message.includes('exists')) {
                    this.logger.warn(`RedisBloom initialization failed (fallback to Sets?): ${err.message}`);
                }
            }
        }
    }

    /**
     * Отозвать сертификат
     */
    async revokeCertificate(certificateId: string): Promise<boolean> {
        const client = this.redisService.getClient();
        try {
            await client.call('BF.ADD', this.BLOOM_KEY, certificateId);
            this.logger.warn(`Certificate REVOKED: ${certificateId}`);

            // Здесь должна быть логика триггеров рассылки Webhook'ов 
            // страховым компаниям, например отправка в BullMQ очередь.
            this.triggerRevocationWebhooks(certificateId);

            return true;
        } catch (error) {
            this.logger.error(`Failed to revoke certificate ${certificateId}`, error);
            return false;
        }
    }

    /**
     * Проверить сертификат (True = отозван, False = валиден/неизвестен)
     */
    async isRevoked(certificateId: string): Promise<boolean> {
        const client = this.redisService.getClient();
        try {
            const exists = await client.call('BF.EXISTS', this.BLOOM_KEY, certificateId);
            return exists === 1;
        } catch (error) {
            this.logger.error(`Failed to check CRL for ${certificateId}`, error);
            // Если Redis упал, Fallback open/strict?
            // По строгости Level F, если не можем проверить CRL - отказываем (Strict Mode)
            return true;
        }
    }

    private triggerRevocationWebhooks(certificateId: string) {
        // Заглушка для Фазы 5: интеграция с брокером сообщений для Event-Driven архитектуры
        this.logger.log(`[Webhook Trigger] Broadcasting revocation of ${certificateId} to Insurance providers...`);
    }
}
