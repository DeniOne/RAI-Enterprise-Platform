import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { RdService } from "../services/RdService";
import { JwtAuthGuard } from "../../../shared/auth/jwt-auth.guard";
import { ProgramStatus } from "@rai/prisma-client";

@Controller("rd/programs")
@UseGuards(JwtAuthGuard)
export class ProgramController {
  constructor(private rdService: RdService) {}

  @Get()
  async findAll(@Request() req: any) {
    return (this.rdService as any).prisma.researchProgram.findMany({
      where: { companyId: req.user.companyId },
    });
  }

  @Post()
  async create(@Body() data: any, @Request() req: any) {
    return (this.rdService as any).prisma.researchProgram.create({
      data: {
        ...data,
        companyId: req.user.companyId,
        status: ProgramStatus.ACTIVE,
      },
    });
  }
}
// Note: Fixed Prisma access in controller by using the service's prisma.
