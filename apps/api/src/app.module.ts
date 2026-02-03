import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './shared/auth/auth.module';
import { AuditModule } from './shared/audit/audit.module';
import { MemoryModule } from './shared/memory/memory.module';
import { RapeseedModule } from './modules/rapeseed/rapeseed.module';
import { AgroAuditModule } from './modules/agro-audit/agro-audit.module';
import { SeasonModule } from './modules/season/season.module';
import { ClientRegistryModule } from './modules/client-registry/client-registry.module';
import { IdentityRegistryModule } from './modules/identity-registry/identity-registry.module';
import { FieldRegistryModule } from './modules/field-registry/field-registry.module';
import { TechnologyCardModule } from './modules/technology-card/technology-card.module';
import { TaskModule } from './modules/task/task.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { TelegrafModule } from 'nestjs-telegraf';
import { join } from 'path';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        AuthModule,
        MemoryModule,
        AuditModule,
        RapeseedModule,
        AgroAuditModule,
        SeasonModule,
        ClientRegistryModule,
        IdentityRegistryModule,
        FieldRegistryModule,
        TechnologyCardModule,
        TaskModule,
        TelegramModule,

        TelegrafModule.forRootAsync({
            useFactory: () => ({
                token: process.env.TELEGRAM_BOT_TOKEN,
            }),
        }),

        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            sortSchema: true,
            playground: true,
        }),
    ],
})
export class AppModule { }
