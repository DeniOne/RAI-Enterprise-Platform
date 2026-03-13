import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SecretsModule } from "../../shared/config/secrets.module";
import { TelegramNotificationService } from "./telegram-notification.service";

@Module({
  imports: [ConfigModule, SecretsModule],
  providers: [TelegramNotificationService],
  exports: [TelegramNotificationService],
})
export class TelegramNotificationModule {}
