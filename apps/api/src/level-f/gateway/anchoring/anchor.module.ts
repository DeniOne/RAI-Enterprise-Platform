import { Module } from "@nestjs/common";
import { AnchorService } from "./anchor.service";
import { NodeWatcherService } from "./node-watcher.service";

@Module({
  providers: [AnchorService, NodeWatcherService],
  exports: [AnchorService, NodeWatcherService],
})
export class AnchorModule {}
