import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async log(data: { action: string; userId?: string; ip?: string; userAgent?: string; metadata?: any; }) {
        console.log(`[AUDIT] ${data.action} | User: ${data.userId || 'GUEST'}`);
        return this.prisma.auditLog.create({
            data: {
                action: data.action,
                userId: data.userId,
                ip: data.ip,
                userAgent: data.userAgent,
                metadata: data.metadata || {},
            },
        });
    }
}
