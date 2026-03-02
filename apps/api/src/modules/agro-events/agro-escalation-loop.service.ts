import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  AgroEventCommittedRecord,
  AgroEscalationSeverity,
} from "./agro-events.types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const METRIC_KEY = "operationDelayDays";

@Injectable()
export class AgroEscalationLoopService {
  private readonly logger = new Logger(AgroEscalationLoopService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handleCommittedEvent(event: AgroEventCommittedRecord): Promise<void> {
    if (!event.taskRef) {
      return;
    }

    const operation = await this.prisma.mapOperation.findUnique({
      where: { id: event.taskRef },
      select: { plannedEndTime: true },
    });

    if (!operation?.plannedEndTime) {
      return;
    }

    const delayDays = this.calculateDelayDays(
      operation.plannedEndTime,
      event.committedAt,
    );
    const severity = this.evaluateSeverity(delayDays);

    if (severity !== "S3" && severity !== "S4") {
      return;
    }

    const existing = await this.prisma.agroEscalation.findMany({
      where: {
        companyId: event.companyId,
        metricKey: METRIC_KEY,
      },
      select: {
        id: true,
        references: true,
      },
    });

    const duplicate = existing.find((item) => {
      const references =
        item.references && typeof item.references === "object"
          ? (item.references as Record<string, unknown>)
          : null;
      return references?.eventId === event.id;
    });

    if (duplicate) {
      return;
    }

    const reason = `operationDelayDays=${delayDays}; plannedEnd=${operation.plannedEndTime.toISOString()}; committedAt=${event.committedAt}`;

    await this.prisma.agroEscalation.create({
      data: {
        companyId: event.companyId,
        metricKey: METRIC_KEY,
        severity,
        reason,
        status: "OPEN",
        references: {
          eventId: event.id,
          fieldRef: event.fieldRef,
          taskRef: event.taskRef,
        } as any,
      },
    });

    this.logger.warn(
      `Agro escalation created: ${event.id} ${METRIC_KEY}=${delayDays} ${severity}`,
    );
  }

  private calculateDelayDays(plannedEndTime: Date, committedAt: string): number {
    const diffMs =
      new Date(committedAt).getTime() - new Date(plannedEndTime).getTime();
    const delayDays = Math.floor(diffMs / MS_PER_DAY);

    return delayDays > 0 ? delayDays : 0;
  }

  private evaluateSeverity(delayDays: number): AgroEscalationSeverity {
    if (delayDays >= 7) {
      return "S4";
    }
    if (delayDays >= 4) {
      return "S3";
    }
    if (delayDays >= 2) {
      return "S2";
    }
    if (delayDays >= 1) {
      return "S1";
    }

    return "S0";
  }
}
