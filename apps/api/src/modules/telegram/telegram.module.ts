import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TelegramUpdate } from "./telegram.update";
import { TaskModule } from "../task/task.module";
import { PrismaModule } from "../../shared/prisma/prisma.module";
import { ProgressService } from "./progress.service";
import { TelegramNotificationService } from "./telegram-notification.service";

import { AuthModule } from "../../shared/auth/auth.module";
import { SecretsModule } from "../../shared/config/secrets.module";

@Module({
  imports: [TaskModule, PrismaModule, AuthModule, ConfigModule, SecretsModule],
  providers: [TelegramUpdate, ProgressService, TelegramNotificationService],
  exports: [ProgressService, TelegramNotificationService],
})
export class TelegramModule {}
