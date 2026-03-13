import { Module } from "@nestjs/common";
import { OutboxService } from "./outbox.service";
import { OutboxRelay } from "./outbox.relay";
import { ConsumerIdempotencyService } from "./consumer-idempotency.service";
import { OutboxBrokerPublisher } from "./outbox-broker.publisher";
import { OutboxWakeupService } from "./outbox-wakeup.service";
import { PrismaModule } from "../prisma/prisma.module";
import { RedisModule } from "../redis/redis.module";
import { SecretsModule } from "../config/secrets.module";

@Module({
  imports: [PrismaModule, RedisModule, SecretsModule],
  providers: [
    OutboxService,
    OutboxRelay,
    ConsumerIdempotencyService,
    OutboxBrokerPublisher,
    OutboxWakeupService,
  ],
  exports: [OutboxService],
})
export class OutboxModule {}
