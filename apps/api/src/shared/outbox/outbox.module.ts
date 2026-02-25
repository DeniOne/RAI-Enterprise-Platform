import { Module } from "@nestjs/common";
import { OutboxService } from "./outbox.service";
import { OutboxRelay } from "./outbox.relay";
import { ConsumerIdempotencyService } from "./consumer-idempotency.service";
import { OutboxBrokerPublisher } from "./outbox-broker.publisher";
import { PrismaModule } from "../prisma/prisma.module";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [PrismaModule, ScheduleModule.forRoot()],
  providers: [
    OutboxService,
    OutboxRelay,
    ConsumerIdempotencyService,
    OutboxBrokerPublisher,
  ],
  exports: [OutboxService],
})
export class OutboxModule {}
