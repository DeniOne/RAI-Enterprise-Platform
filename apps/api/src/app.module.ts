import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuditModule } from './shared/audit/audit.module';
import { MemoryModule } from './shared/memory/memory.module';
import { RapeseedModule } from './modules/rapeseed/rapeseed.module';
import { AgroAuditModule } from './modules/agro-audit/agro-audit.module';
import { SeasonModule } from './modules/season/season.module';
import { join } from 'path';

@Module({
    imports: [
        PrismaModule,
        MemoryModule,
        AuditModule,
        RapeseedModule,
        AgroAuditModule,
        SeasonModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            sortSchema: true,
            playground: true,
        }),
    ],
})
export class AppModule { }
