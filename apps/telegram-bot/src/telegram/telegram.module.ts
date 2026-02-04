import { Module } from "@nestjs/common";
import { TelegramUpdate } from "./telegram.update";
// import { TaskModule } from "../task/task.module"; // Removed: TaskModule not available in bot microservice
import { PrismaModule } from "../shared/prisma/prisma.module";
import { ProgressService } from "./progress.service";

@Module({
  imports: [PrismaModule], // Removed TaskModule
  providers: [TelegramUpdate, ProgressService],
  exports: [ProgressService],
})
export class TelegramModule { }
