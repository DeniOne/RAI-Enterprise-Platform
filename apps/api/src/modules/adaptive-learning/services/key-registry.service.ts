import { Injectable, Logger } from '@nestjs/common';

export interface MLPublicKey {
    id: string;
    publicKey: string;
    expiresAt: Date;
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

@Injectable()
export class KeyRegistryService {
    private readonly logger = new Logger(KeyRegistryService.name);

    // В Phase B храним в памяти/конфиге, в проде — в Vault/DB.
    private keys: MLPublicKey[] = [];

    constructor() {
        // Дефолтный ключ для отладки
        this.keys.push({
            id: 'system-ml-v1',
            publicKey: process.env.ML_SYSTEM_PUBLIC_KEY || 'dummy_key',
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
        });
    }

    getKey(id: string): MLPublicKey | undefined {
        return this.keys.find(k => k.id === id && k.status === 'ACTIVE');
    }

    revokeKey(id: string) {
        const key = this.keys.find(k => k.id === id);
        if (key) {
            key.status = 'REVOKED';
            this.logger.warn(`🚫 Key ${id} has been revoked.`);
        }
    }
}
