import { Module } from "@nestjs/common";
import { SnapshotService } from "./snapshot.service";
import { SnapshotController } from "./snapshot.controller";
import { PrismaModule } from "../../shared/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [SnapshotService],
  controllers: [SnapshotController],
  exports: [SnapshotService],
})
export class SnapshotModule {}
