import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramModule } from './telegram/telegram.module';
import { ApiClientModule } from './shared/api-client/api-client.module';
import { RedisModule } from './shared/redis/redis.module';
import { SessionModule } from './shared/session/session.module';
import { BotInternalController } from './shared/bot-internal.controller';
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['../../.env', '.env'],
      isGlobal: true,
    }),
    TelegrafModule.forRootAsync({
      useFactory: () => ({
        token: process.env.TELEGRAM_BOT_TOKEN || '',
      }),
    }),
    RedisModule,
    SessionModule,
    ApiClientModule,
    TelegramModule,
    PrismaModule,
  ],
  controllers: [BotInternalController],
})
export class AppModule { }
