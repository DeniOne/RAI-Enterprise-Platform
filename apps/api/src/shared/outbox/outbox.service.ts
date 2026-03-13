import { Injectable, Optional } from "@nestjs/common";
import { Prisma } from "@rai/prisma-client";
import { resolveEventVersion } from "./event-contracts";
import { OutboxWakeupService } from "./outbox-wakeup.service";

interface OutboxEventOptions {
  allowSystemScope?: boolean;
}

type OutboxWriter = {
  outboxMessage: {
    create: (args: {
      data: Prisma.OutboxMessageCreateInput;
    }) => Promise<unknown>;
    createMany: (args: {
      data: Prisma.OutboxMessageCreateInput[];
    }) => Promise<unknown>;
  };
};

@Injectable()
export class OutboxService {
  constructor(
    @Optional() private readonly wakeupService?: OutboxWakeupService,
  ) {}

  /**
   * Generates a Prisma.OutboxMessageCreateInput for usage within a transaction.
   * Does NOT execute the write itself.
   */
  createEvent(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    payload: any,
    options?: OutboxEventOptions,
  ): Prisma.OutboxMessageCreateInput {
    const allowSystemScope = options?.allowSystemScope === true;
    if (!allowSystemScope && !this.hasCompanyId(payload)) {
      throw new Error(
        `Outbox tenant contract violation: event=${eventType} requires payload.companyId`,
      );
    }
    const eventVersion = resolveEventVersion(eventType, payload);
    const payloadWithContract = this.withEventContract(payload, eventVersion);

    return {
      aggregateId,
      aggregateType,
      type: eventType,
      payload: payloadWithContract as Prisma.InputJsonValue,
      status: "PENDING",
    };
  }

  async persistEvent(
    writer: OutboxWriter,
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    payload: any,
    options?: OutboxEventOptions,
  ): Promise<void> {
    const event = this.createEvent(
      aggregateId,
      aggregateType,
      eventType,
      payload,
      options,
    );

    await writer.outboxMessage.create({ data: event });
    await this.publishWakeupHint({
      reason: "event_persisted",
      eventType,
      companyId: this.extractCompanyId(payload),
      count: 1,
    });
  }

  async persistPreparedEvents(
    writer: OutboxWriter,
    events: Prisma.OutboxMessageCreateInput[],
  ): Promise<void> {
    if (events.length === 0) {
      return;
    }

    await writer.outboxMessage.createMany({ data: events });

    const firstType =
      typeof events[0]?.type === "string" ? (events[0].type as string) : null;
    const uniqueTypes = new Set(
      events
        .map((event) =>
          typeof event.type === "string" ? (event.type as string) : null,
        )
        .filter((value): value is string => Boolean(value)),
    );
    const uniqueCompanies = new Set(
      events
        .map((event) => this.extractCompanyId(event.payload))
        .filter((value): value is string => Boolean(value)),
    );

    await this.publishWakeupHint({
      reason: "batch_persisted",
      eventType: uniqueTypes.size === 1 ? firstType : null,
      companyId: uniqueCompanies.size === 1 ? [...uniqueCompanies][0] : null,
      count: events.length,
    });
  }

  private hasCompanyId(payload: any): boolean {
    if (!payload || typeof payload !== "object") {
      return false;
    }
    if (Object.prototype.hasOwnProperty.call(payload, "companyId")) {
      const v = payload.companyId;
      return typeof v === "string" && v.trim().length > 0;
    }
    return false;
  }

  private withEventContract(payload: any, eventVersion: number): any {
    if (!payload || typeof payload !== "object") {
      return { eventVersion };
    }
    if (Object.prototype.hasOwnProperty.call(payload, "eventVersion")) {
      return payload;
    }
    return { ...payload, eventVersion };
  }

  private async publishWakeupHint(
    partial: {
      reason: string;
      eventType?: string | null;
      companyId?: string | null;
      count?: number | null;
    },
  ): Promise<void> {
    if (!this.wakeupService) {
      return;
    }

    await this.wakeupService.publishHint(partial);
  }

  private extractCompanyId(payload: unknown): string | null {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const value = (payload as Record<string, unknown>).companyId;
    return typeof value === "string" && value.trim().length > 0 ? value : null;
  }
}
