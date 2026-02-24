import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { CreateFulfillmentEventDto } from "../dto/create-fulfillment-event.dto";

@Injectable()
export class FulfillmentService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(dto: CreateFulfillmentEventDto) {
    if (dto.eventDomain === "COMMERCIAL" && dto.eventType === "GOODS_SHIPMENT" && !dto.batchId) {
      throw new BadRequestException("batchId is required for COMMERCIAL GOODS_SHIPMENT");
    }

    const event = await this.prisma.commerceFulfillmentEvent.create({
      data: {
        obligationId: dto.obligationId,
        eventDomain: dto.eventDomain,
        eventType: dto.eventType,
        eventDate: new Date(dto.eventDate),
        payloadJson: {
          batchId: dto.batchId,
          itemId: dto.itemId,
          uom: dto.uom,
          qty: dto.qty,
        },
      },
    });

    if (dto.eventDomain === "COMMERCIAL" && dto.eventType === "GOODS_SHIPMENT") {
      await this.prisma.stockMove.create({
        data: {
          fulfillmentEventId: event.id,
          itemId: dto.itemId ?? "UNKNOWN_ITEM",
          uom: dto.uom ?? "unit",
          qty: dto.qty ? String(dto.qty) : "0",
          batchId: dto.batchId,
        },
      });
    }

    return event;
  }
}
