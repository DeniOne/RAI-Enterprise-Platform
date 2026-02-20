import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
// Force restart
import * as Joi from 'joi';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { RedisModule } from "./shared/redis/redis.module";
import { PrismaModule } from "./shared/prisma/prisma.module";
import { S3Module } from "./shared/s3/s3.module";
import { AuthModule } from "./shared/auth/auth.module";
import { AuditModule } from "./shared/audit/audit.module";
import { MemoryModule } from "./shared/memory/memory.module";
import { RapeseedModule } from "./modules/rapeseed/rapeseed.module";
import { AgroAuditModule } from "./modules/agro-audit/agro-audit.module";
import { SeasonModule } from "./modules/season/season.module";
import { CrmModule } from "./modules/crm/crm.module";
import { IdentityRegistryModule } from "./modules/identity-registry/identity-registry.module";
import { FieldRegistryModule } from "./modules/field-registry/field-registry.module";
import { TechnologyCardModule } from "./modules/technology-card/technology-card.module";
import { TaskModule } from "./modules/task/task.module";
import { AgroOrchestratorModule } from "./modules/agro-orchestrator/agro-orchestrator.module";
import { TechMapModule } from "./modules/tech-map/tech-map.module";
import { CmrModule } from "./modules/cmr/cmr.module";
import { HrModule } from "./modules/hr/hr.module";
import { FinanceEconomyModule } from "./modules/finance-economy/finance-economy.module";
import { KnowledgeModule } from "./modules/knowledge/knowledge.module";
import { KnowledgeGraphModule } from "./modules/knowledge-graph/knowledge-graph.module";
import { VisionModule } from "./modules/vision/vision.module";
import { SatelliteModule } from "./modules/satellite/satellite.module";
import { LegalModule } from "./modules/legal/legal.module.js";
import { RdModule } from "./modules/rd/rd.module.js";
import { StrategicModule } from "./modules/strategic/strategic.module.js";
import { RiskModule } from "./modules/risk/risk.module.js";
import { FieldObservationModule } from "./modules/field-observation/field-observation.module";
import { IntegrityModule } from "./modules/integrity/integrity.module";
import { ConsultingModule } from "./modules/consulting/consulting.module";
import { AdvisoryModule } from "./modules/advisory/advisory.module";
import { HealthModule } from "./modules/health/health.module";
import { AdaptiveLearningModule } from "./modules/adaptive-learning/adaptive-learning.module";
import { HttpResilienceModule } from "./shared/http/http-resilience.module";
import { BullModule } from "@nestjs/bullmq";
import { join } from "path";

import { OutboxModule } from './shared/outbox/outbox.module';
import { InvariantMetricsModule } from "./shared/invariants/invariant-metrics.module";
import { GatewayModule } from "./level-f/gateway/gateway.module";
import { CryptoModule } from "./level-f/crypto/crypto.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env", "../../.env"],
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test', 'provision').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        JWT_SECRET: Joi.string().required(),
        MINIO_ENDPOINT: Joi.string().default('localhost'),
        MINIO_PORT: Joi.number().default(9000),
        MINIO_ROOT_USER: Joi.string().required(),
        MINIO_ROOT_PASSWORD: Joi.string().required(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 1000,  // Increased for load testing
    }]),
    CryptoModule,
    GatewayModule,
    RedisModule,
    PrismaModule,
    S3Module,
    OutboxModule,
    InvariantMetricsModule,
    AuthModule,
    MemoryModule,
    AuditModule,
    RapeseedModule,
    AgroAuditModule,
    SeasonModule,
    CrmModule,
    IdentityRegistryModule,
    FieldRegistryModule,
    TechnologyCardModule,
    TaskModule,
    AgroOrchestratorModule,
    TechMapModule,
    CmrModule,
    HrModule,
    FinanceEconomyModule,
    KnowledgeModule,
    KnowledgeGraphModule,
    VisionModule,
    SatelliteModule,
    LegalModule,
    RdModule,
    StrategicModule,
    RiskModule,
    FieldObservationModule,
    IntegrityModule,
    ConsultingModule,
    AdvisoryModule,
    HealthModule,
    AdaptiveLearningModule,
    HttpResilienceModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      playground: true,
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
