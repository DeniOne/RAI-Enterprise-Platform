import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '../config/prisma';
import { FoundationAuditLog } from '@prisma/client';

export interface CreateFoundationAuditDto {
  userId: string;
  eventType: string; // 'BLOCK_VIEWED', 'DECISION_MADE', 'BLOCKED_ACCESS'
  foundationVersion?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class FoundationAuditService {
  private readonly logger = new Logger(FoundationAuditService.name);

  async createAuditLog(dto: CreateFoundationAuditDto): Promise<FoundationAuditLog> {
    const { userId, eventType, foundationVersion, metadata } = dto;

    this.logger.log(`Creating Foundation Audit Log for user ${userId} - ${eventType}`);

    return prisma.foundationAuditLog.create({
      data: {
        user_id: userId,
        event_type: eventType,
        foundation_version: foundationVersion,
        metadata: metadata || {},
      },
    });
  }

  async getAuditLog(userId: string): Promise<FoundationAuditLog | null> {
    return prisma.foundationAuditLog.findFirst({
      where: { user_id: userId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
