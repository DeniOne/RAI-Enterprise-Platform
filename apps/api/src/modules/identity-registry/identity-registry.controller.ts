import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { IdentityRegistryService } from "./identity-registry.service";
import { LifecycleStatus } from "@rai/prisma-client";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";

@Controller("registry/identities")
@UseGuards(JwtAuthGuard)
export class IdentityRegistryController {
  constructor(private readonly registryService: IdentityRegistryService) { }

  @Post("roles")
  async createRole(
    @Body() body: { name: string; description?: string },
    @Request() req,
  ) {
    const companyId = req.user.companyId;
    return this.registryService.createRole(body, companyId);
  }

  @Get("roles")
  async getRoles(@Request() req) {
    const companyId = req.user.companyId;
    return this.registryService.findRoles(companyId);
  }

  @Get("profiles")
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
  async updateStatus(
    @Param("id") id: string,
    @Body() body: { status: LifecycleStatus },
    @Request() req,
  ) {
    const companyId = req.user.companyId;
    return this.registryService.updateProfileStatus(id, body.status, companyId);
  }
}
