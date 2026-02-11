import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { RedisModule } from "./shared/redis/redis.module";
import { PrismaModule } from "./shared/prisma/prisma.module";
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
import { join } from "path";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [".env", "../../.env"],
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 10,  // 10 requests per minute (default, soft limit)
    }]),
    RedisModule,
    PrismaModule,
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

    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      playground: true,
    }),
  ],
})
export class AppModule {
  constructor() {
    console.log('✅ AppModule initialized');
  }
}
