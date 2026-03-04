import { Module } from "@nestjs/common";
import { CropVarietyService } from "./crop-variety.service";

@Module({
  providers: [CropVarietyService],
  exports: [CropVarietyService],
})
export class CropVarietyModule {}
