import { Controller, Post, Body, Param, UseInterceptors } from "@nestjs/common";
import { RdService } from "../services/RdService";
import { IdempotencyInterceptor } from "../../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../../shared/auth/authorized.decorator";
import { RND_ROLES } from "../../../shared/auth/rbac.constants";

@Controller("rd/trials")
@Authorized(...RND_ROLES)
export class TrialController {
  constructor(private rdService: RdService) {}

  @Post(":id/measurements")
  @UseInterceptors(IdempotencyInterceptor)
  async addMeasurement(@Param("id") id: string, @Body() data: any) {
    // In a real app, we'd check if the trial is already locked via the state of the experiment.
    return (this.rdService as any).prisma.measurement.create({
      data: {
        ...data,
        trialId: id,
      },
    });
  }
}
