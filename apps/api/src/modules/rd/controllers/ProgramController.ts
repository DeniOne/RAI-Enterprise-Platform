import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseInterceptors,
} from "@nestjs/common";
import { RdService } from "../services/RdService";
import { ProgramStatus } from "@rai/prisma-client";
import { IdempotencyInterceptor } from "../../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../../shared/auth/authorized.decorator";
import { RND_ROLES } from "../../../shared/auth/rbac.constants";

@Controller("rd/programs")
@Authorized(...RND_ROLES)
export class ProgramController {
  constructor(private rdService: RdService) {}

  @Get()
  async findAll(@Request() req: any) {
    return (this.rdService as any).prisma.researchProgram.findMany({
      where: { companyId: req.user.companyId },
    });
  }

  @Post()
  @UseInterceptors(IdempotencyInterceptor)
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
