import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import * as crypto from "crypto";

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an immutable event in the registry.
   * This provides the "Genesis Audit Trail" for Level E.
   */
  async recordGovernanceEvent(data: {
    fieldId: string;
    companyId: string;
    eventType: string;
    actorId: string;
    details: any;
  }) {
    const payload = JSON.stringify(data.details);
    const eventHash = crypto
      .createHash("sha256")
      .update(`${data.fieldId}-${data.eventType}-${payload}-${Date.now()}`)
      .digest("hex");

    this.logger.log(
      `[AUDIT] Recording Governance Event: ${data.eventType} with Hash: ${eventHash.substring(0, 8)}`,
    );

    // We store this in a dedicated audit table or as a LearningEvent (using existing schema)
    return await this.prisma.learningEvent.create({
      data: {
        companyId: data.companyId,
        featureId: `GOVERNANCE-${data.eventType}`,
        event: `GOVERNANCE_AUDIT`,
        payload: {
          ...data.details,
          eventHash,
          actorId: data.actorId,
          timestamp: new Date().toISOString(),
        } as any,
        signature: eventHash, // Using hash as a temporary signature for now
      },
    });
  }
}
