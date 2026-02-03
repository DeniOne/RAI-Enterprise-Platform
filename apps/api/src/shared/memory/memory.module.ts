import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ContextService } from "../cache/context.service.js";
import { MemoryManager } from "./memory-manager.service.js";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ContextService, MemoryManager],
  exports: [ContextService, MemoryManager],
})
export class MemoryModule {}
