import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
// Force restart
import * as Joi from "joi";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
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
import { CommerceModule } from "./modules/commerce/commerce.module";
import { ExplorationModule } from "./modules/exploration/exploration.module";
import { HttpResilienceModule } from "./shared/http/http-resilience.module";
import { BullModule } from "@nestjs/bullmq";
import { join } from "path";
import { RaiChatModule } from "./modules/rai-chat/rai-chat.module";
import { AgroEventsModule } from "./modules/agro-events/agro-events.module";
import { CropVarietyModule } from "./modules/crop-variety/crop-variety.module";

import { OutboxModule } from "./shared/outbox/outbox.module";
import { InvariantMetricsModule } from "./shared/invariants/invariant-metrics.module";
import { GatewayModule } from "./level-f/gateway/gateway.module";
import { CryptoModule } from "./level-f/crypto/crypto.module";
import { TenantContextModule } from "./shared/tenant-context/tenant-context.module";
import { ExplainabilityPanelModule } from "./modules/explainability/explainability-panel.module";
import { FrontOfficeModule } from "./modules/front-office/front-office.module";
import { CustomThrottlerGuard } from "./shared/guards/throttler.guard";
import { SecretsModule } from "./shared/config/secrets.module";

@Module({
  imports: [
    TenantContextModule,
    ConfigModule.forRoot({
      envFilePath: [".env", "../../.env"],
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid("development", "production", "test", "provision")
          .default("development"),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_HOST: Joi.string().default("localhost"),
        REDIS_PORT: Joi.number().default(6379),
        JWT_SECRET: Joi.string().allow("").optional(),
        JWT_SECRET_FILE: Joi.string().optional(),
        INTERNAL_API_KEY: Joi.string().allow("").optional(),
        INTERNAL_API_KEY_FILE: Joi.string().optional(),
        AUDIT_SECRET: Joi.string().allow("").optional(),
        AUDIT_SECRET_FILE: Joi.string().optional(),
        MINIO_ENDPOINT: Joi.string().default("localhost"),
        MINIO_PORT: Joi.number().default(9000),
        MINIO_USE_SSL: Joi.string().valid("true", "false").optional(),
        MINIO_ACCESS_KEY: Joi.string().optional(),
        MINIO_ACCESS_KEY_FILE: Joi.string().optional(),
        MINIO_SECRET_KEY: Joi.string().optional(),
        MINIO_SECRET_KEY_FILE: Joi.string().optional(),
        MINIO_BUCKET_NAME: Joi.string().default("rai-artifacts"),
        MINIO_ROOT_USER: Joi.string().allow("").optional(),
        MINIO_ROOT_USER_FILE: Joi.string().optional(),
        MINIO_ROOT_PASSWORD: Joi.string().allow("").optional(),
        MINIO_ROOT_PASSWORD_FILE: Joi.string().optional(),
        CORE_API_KEY: Joi.string().allow("").optional(),
        CORE_API_KEY_FILE: Joi.string().optional(),
        OUTBOX_RELAY_ENABLED: Joi.string().valid("true", "false").optional(),
        OUTBOX_RELAY_SCHEDULE_ENABLED: Joi.string()
          .valid("true", "false")
          .optional(),
        OUTBOX_RELAY_BOOTSTRAP_DRAIN_ENABLED: Joi.string()
          .valid("true", "false")
          .optional(),
        OUTBOX_RELAY_BATCH_SIZE: Joi.number().integer().min(1).max(500).optional(),
        OUTBOX_RELAY_WAKEUP_ENABLED: Joi.string()
          .valid("true", "false")
          .optional(),
        OUTBOX_RELAY_WAKEUP_CHANNEL: Joi.string().optional(),
        OUTBOX_RELAY_WAKEUP_DEBOUNCE_MS: Joi.number()
          .integer()
          .min(1)
          .optional(),
        OUTBOX_MAX_RETRIES: Joi.number().integer().min(1).max(50).optional(),
        OUTBOX_RETRY_BASE_DELAY_MS: Joi.number().integer().min(1).optional(),
        OUTBOX_ORDERING_DEFER_MS: Joi.number().integer().min(1).optional(),
        OUTBOX_PROCESSING_STALE_AFTER_MS: Joi.number()
          .integer()
          .min(1000)
          .optional(),
        OUTBOX_DELIVERY_MODE: Joi.string()
          .valid("local_only", "broker_only", "dual")
          .optional(),
        OUTBOX_BROKER_TRANSPORT: Joi.string()
          .valid("http", "redis_streams")
          .optional(),
        OUTBOX_ALLOW_LOCAL_ONLY_IN_PRODUCTION: Joi.string()
          .valid("true", "false")
          .optional(),
        OUTBOX_EVENT_CONTRACT_ENFORCE: Joi.string()
          .valid("true", "false")
          .optional(),
        OUTBOX_BROKER_ENDPOINT: Joi.string()
          .uri({ scheme: ["http", "https"] })
          .allow("")
          .optional(),
        OUTBOX_BROKER_TIMEOUT_MS: Joi.number().integer().min(1).optional(),
        OUTBOX_BROKER_AUTH_TOKEN: Joi.string().allow("").optional(),
        OUTBOX_BROKER_AUTH_TOKEN_FILE: Joi.string().optional(),
        OUTBOX_BROKER_REDIS_STREAM_KEY: Joi.string().optional(),
        OUTBOX_BROKER_REDIS_STREAM_MAXLEN: Joi.number()
          .integer()
          .min(1)
          .optional(),
        OUTBOX_BROKER_REDIS_CONSUMER_GROUPS: Joi.string().optional(),
        OUTBOX_BROKER_REDIS_TENANT_PARTITIONING: Joi.string()
          .valid("true", "false")
          .optional(),
        HSM_PROVIDER: Joi.string().valid("memory", "vault-transit").optional(),
        HSM_SIGNING_KEY_NAME: Joi.string().optional(),
        HSM_KID_PREFIX: Joi.string().optional(),
        HSM_ALLOW_MEMORY_PROVIDER_IN_PRODUCTION: Joi.string()
          .valid("true", "false")
          .optional(),
        HSM_DEV_PRIVATE_KEY: Joi.string().allow("").optional(),
        HSM_DEV_PRIVATE_KEY_FILE: Joi.string().optional(),
        HSM_VAULT_ADDR: Joi.string()
          .uri({ scheme: ["http", "https"] })
          .allow("")
          .optional(),
        HSM_VAULT_TOKEN: Joi.string().allow("").optional(),
        HSM_VAULT_TOKEN_FILE: Joi.string().optional(),
        HSM_VAULT_NAMESPACE: Joi.string().allow("").optional(),
        HSM_VAULT_TRANSIT_MOUNT: Joi.string().optional(),
        HSM_VAULT_KEY_AUTO_CREATE: Joi.string()
          .valid("true", "false")
          .optional(),
        HSM_VAULT_AUTO_ROTATE_PERIOD: Joi.string().optional(),
        HSM_VAULT_TIMEOUT_MS: Joi.number().integer().min(100).optional(),
        HSM_VAULT_CACERT_FILE: Joi.string().optional(),
        HSM_VAULT_SKIP_TLS_VERIFY: Joi.string()
          .valid("true", "false")
          .optional(),
        NVIDIA_API_KEY: Joi.string().allow("").optional(),
        NVIDIA_API_KEY_FILE: Joi.string().optional(),
        OPENROUTER_API_KEY: Joi.string().allow("").optional(),
        OPENROUTER_API_KEY_FILE: Joi.string().optional(),
        AUDIT_WORM_PROVIDER: Joi.string()
          .valid("filesystem", "s3_compatible", "dual")
          .optional(),
        AUDIT_WORM_ALLOW_FILESYSTEM_IN_PRODUCTION: Joi.string()
          .valid("true", "false")
          .optional(),
        AUDIT_WORM_BASE_PATH: Joi.string().optional(),
        WORM_S3_BUCKET: Joi.string().allow("").optional(),
        WORM_S3_PREFIX: Joi.string().optional(),
        WORM_S3_REGION: Joi.string().optional(),
        WORM_S3_OBJECT_LOCK_REQUIRED: Joi.string()
          .valid("true", "false")
          .optional(),
        WORM_S3_AUTO_CREATE_BUCKET: Joi.string()
          .valid("true", "false")
          .optional(),
        WORM_S3_AUTO_CONFIGURE_DEFAULT_RETENTION: Joi.string()
          .valid("true", "false")
          .optional(),
        WORM_S3_RETENTION_MODE: Joi.string()
          .valid("COMPLIANCE", "GOVERNANCE")
          .optional(),
        WORM_S3_RETENTION_YEARS: Joi.number().integer().min(1).max(100).optional(),
      })
        .or("JWT_SECRET", "JWT_SECRET_FILE")
        .or(
          "MINIO_ACCESS_KEY",
          "MINIO_ACCESS_KEY_FILE",
          "MINIO_ROOT_USER",
          "MINIO_ROOT_USER_FILE",
        )
        .or(
          "MINIO_SECRET_KEY",
          "MINIO_SECRET_KEY_FILE",
          "MINIO_ROOT_PASSWORD",
          "MINIO_ROOT_PASSWORD_FILE",
        ),
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    SecretsModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 1000, // Increased for load testing
      },
    ]),
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
    CropVarietyModule,
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
    FrontOfficeModule,
    HealthModule,
    AdaptiveLearningModule,
    CommerceModule,
    ExplorationModule,
    RaiChatModule,
    AgroEventsModule,
    ExplainabilityPanelModule,
    HttpResilienceModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      playground: true,
      context: ({ req, res }) => ({ req, res }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule { }
