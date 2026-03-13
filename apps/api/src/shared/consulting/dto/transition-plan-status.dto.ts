import { IsEnum } from "class-validator";
import { HarvestPlanStatus } from "@rai/prisma-client";

export class TransitionPlanStatusDto {
  @IsEnum(HarvestPlanStatus)
  status: HarvestPlanStatus;
}
