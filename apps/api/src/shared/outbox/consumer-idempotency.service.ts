import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ConsumerIdempotencyService {
  private readonly logger = new Logger(ConsumerIdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reserves (consumer,eventId) pair.
   * Returns false when event was already processed by the same consumer.
   */
  async reserve(params: {
    consumer: string;
    eventId: string;
    eventType: string;
    aggregateId?: string | null;
    companyId?: string | null;
  }): Promise<boolean> {
    try {
      await (this.prisma as any).eventConsumption.create({
        data: {
          consumer: params.consumer,
          eventId: params.eventId,
          eventType: params.eventType,
          aggregateId: params.aggregateId ?? null,
          companyId: params.companyId ?? null,
        },
      });
      return true;
    } catch (error: any) {
      // Prisma unique violation: this consumer already processed this event.
      if (error?.code === "P2002") {
        return false;
      }
      this.logger.error(
        `Idempotency reserve failed for ${params.consumer}/${params.eventId}: ${error?.message || error}`,
      );
      throw error;
    }
  }
}
