import {
  Controller,
  Post,
  Body,
  Param,
  Request,
  UseInterceptors,
} from "@nestjs/common";
import { RdService } from "../services/RdService";
import { ExperimentState } from "@rai/prisma-client";
import { IdempotencyInterceptor } from "../../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../../shared/auth/authorized.decorator";
import { RND_ROLES } from "../../../shared/auth/rbac.constants";

@Controller("rd/experiments")
@Authorized(...RND_ROLES)
export class ExperimentController {
  constructor(private rdService: RdService) {}

  @Post(":id/transition")
  @UseInterceptors(IdempotencyInterceptor)
  async transition(
    @Param("id") id: string,
    @Body("state") state: ExperimentState,
    @Request() req: any,
  ) {
    return this.rdService.orchestrator.transitionState(id, state, req.user.id);
  }

  @Post("protocols/:id/approve")
  @UseInterceptors(IdempotencyInterceptor)
  async approveProtocol(@Param("id") id: string, @Request() req: any) {
    return this.rdService.orchestrator.approveProtocol(id, req.user.id);
  }
}
