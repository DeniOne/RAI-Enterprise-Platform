import { Module } from "@nestjs/common";
import { CrlService } from "./crl.service";

@Module({
  providers: [CrlService],
  exports: [CrlService],
})
export class CrlModule {}
