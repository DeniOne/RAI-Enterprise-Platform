import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseInterceptors,
} from "@nestjs/common";
import { ClientRegistryService } from "./client-registry.service";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { Roles } from "../../shared/auth/roles.decorator";
import {
  COMMERCE_READ_ROLES,
  COMMERCE_WRITE_ROLES,
} from "../../shared/auth/rbac.constants";
// Assuming internal tenant/user extraction from req. user decorator is standard in this project
// For now using simple placeholders for companyId

@Controller("registry/clients")
@Authorized(...COMMERCE_READ_ROLES)
export class ClientRegistryController {
  constructor(private readonly registryService: ClientRegistryService) {}

  @Post("holdings")
  @Roles(...COMMERCE_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async createHolding(
    @Body() body: { name: string; description?: string; companyId: string },
  ) {
    // In production, companyId comes from JWT
    return this.registryService.createHolding(body, body.companyId);
  }

  @Get("holdings/:companyId")
  async getAllHoldings(@Param("companyId") companyId: string) {
    return this.registryService.findAllHoldings(companyId);
  }

  @Get("holdings/:id/:companyId")
  async getHolding(
    @Param("id") id: string,
    @Param("companyId") companyId: string,
  ) {
    return this.registryService.findOneHolding(id, companyId);
  }

  @Delete("holdings/:id/:companyId")
  @Roles(...COMMERCE_WRITE_ROLES)
  async deleteHolding(
    @Param("id") id: string,
    @Param("companyId") companyId: string,
  ) {
    return this.registryService.deleteHolding(id, companyId);
  }

  @Put(":id/holding")
  @Roles(...COMMERCE_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async linkToHolding(
    @Param("id") id: string,
    @Body() body: { holdingId: string | null; companyId: string },
  ) {
    return this.registryService.updateAccountHolding(
      id,
      body.holdingId,
      body.companyId,
    );
  }
}
