import { Module } from "@nestjs/common";
import { TelegramUpdate } from "./telegram.update";
// import { TaskModule } from "../task/task.module"; // Removed: TaskModule not available in bot microservice
import { ProgressService } from "./progress.service";

@Module({
  imports: [], // Removed TaskModule and PrismaModule
  providers: [TelegramUpdate, ProgressService],
  exports: [ProgressService],
})
export class TelegramModule { }
