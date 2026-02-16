import { Injectable, Logger } from "@nestjs/common";
import { AuditService } from "../../shared/audit/audit.service";
import { AgriculturalAuditEvent } from "./enums/audit-events.enum";
import { User } from "@rai/prisma-client";

import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class AgroAuditService {
  private readonly logger = new Logger(AgroAuditService.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Logs a specific agricultural event.
   */
  async log(
    event: AgriculturalAuditEvent,
    user: User | { id: string; email?: string } | null,
    metadata: Record<string, any> = {},
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.auditService.log({
        action: event,
        userId: user?.id,
        metadata: {
          ...metadata,
          userEmail: user && "email" in user ? user.email : undefined,
        },
        ip,
        userAgent,
      });
    } catch (error) {
      this.logger.error(`Failed to log agro audit event: ${event}`, error);
      // Fail-safe: don't throw error to avoid blocking main business logic,
      // but strictly log this failure
    }
  }

  /**
   * Logs rapeseed parameters change with diff.
   */
  async logRapeseedChange(
    rapeseedId: string,
    version: number,
    userId: string,
    diff: any,
  ): Promise<void> {
    await this.log(
      AgriculturalAuditEvent.RAPESEED_PARAMETERS_CHANGED,
      { id: userId },
      { rapeseedId, version, diff },
    );
  }

  /**
   * Logs a specific agricultural event with retries and exponential backoff.
   */
  async logWithRetry(
    event: AgriculturalAuditEvent,
    user: User | { id: string; email?: string } | null,
    metadata: any,
    maxRetries = 3,
  ): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.log(event, user, metadata);
        return;
      } catch (error) {
        lastError = error as Error;

        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 100 * Math.pow(2, attempt)),
        );

        // Log to separate failures table
        if (attempt < maxRetries - 1) {
          try {
            await this.prisma.auditFailure.create({ // tenant-lint:ignore AuditFailure model has no companyId column
              data: {
                event,
                userId: user?.id,
                metadata: JSON.stringify(metadata),
                error: lastError.message,
                attempt: attempt + 1,
              },
            });
          } catch (failLogErr) {
            this.logger.error(
              "CRITICAL: Failed to log audit failure itself",
              failLogErr,
            );
          }
        }
      }
    }

    throw new Error(
      `Failed to log audit event after ${maxRetries} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Logs rotation violation (WARNING/ERROR).
   */
  async logRotationViolation(
    fieldId: string,
    violationRule: string,
    severity: string,
    userId?: string,
  ): Promise<void> {
    await this.log(
      AgriculturalAuditEvent.RAPESEED_ROTATION_VIOLATION,
      userId ? { id: userId } : null,
      { fieldId, violationRule, severity },
    );
  }
}
