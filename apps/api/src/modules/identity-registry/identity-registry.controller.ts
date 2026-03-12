import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  Request,
  UseInterceptors,
} from "@nestjs/common";
import { IdentityRegistryService } from "./identity-registry.service";
import { LifecycleStatus } from "@rai/prisma-client";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../shared/auth/authorized.decorator";
import {
  COMMERCE_READ_ROLES,
  COMMERCE_WRITE_ROLES,
} from "../../shared/auth/rbac.constants";

@Controller("registry/identities")
export class IdentityRegistryController {
  constructor(private readonly registryService: IdentityRegistryService) { }

  @Post("roles")
  @Authorized(...COMMERCE_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async createRole(
    @Body() body: { name: string; description?: string },
    @Request() req,
  ) {
    const companyId = req.user.companyId;
    return this.registryService.createRole(body, companyId);
  }

  @Get("roles")
  @Authorized(...COMMERCE_READ_ROLES)
  async getRoles(@Request() req) {
    const companyId = req.user.companyId;
    return this.registryService.findRoles(companyId);
  }

  @Get("profiles")
  @Authorized(...COMMERCE_READ_ROLES)
  async getProfiles(
    @Request() req,
    @Query("clientId") clientId?: string,
    @Query("holdingId") holdingId?: string,
  ) {
    const companyId = req.user.companyId;
    return this.registryService.findProfiles(companyId, {
      clientId,
      holdingId,
    });
  }

  @Put("profiles/:id/status")
  @Authorized(...COMMERCE_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: LifecycleStatus },
    @Request() req,
  ) {
    const companyId = req.user.companyId;
    return this.registryService.updateProfileStatus(id, body.status, companyId);
  }
}
