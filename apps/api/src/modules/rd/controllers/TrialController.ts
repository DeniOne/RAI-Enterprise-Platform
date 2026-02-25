import { Controller, Post, Body, Param, UseGuards } from "@nestjs/common";
import { RdService } from "../services/RdService";
import { JwtAuthGuard } from "../../../shared/auth/jwt-auth.guard";

@Controller("rd/trials")
@UseGuards(JwtAuthGuard)
export class TrialController {
  constructor(private rdService: RdService) {}

  @Post(":id/measurements")
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
