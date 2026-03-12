import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { WormStorageService } from "./worm-storage.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [WormStorageService],
  exports: [WormStorageService],
})
export class WormModule {}
