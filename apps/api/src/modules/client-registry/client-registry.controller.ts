import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ClientRegistryService } from "./client-registry.service";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
// Assuming internal tenant/user extraction from req. user decorator is standard in this project
// For now using simple placeholders for companyId

@Controller("registry/clients")
@UseGuards(JwtAuthGuard)
export class ClientRegistryController {
  constructor(private readonly registryService: ClientRegistryService) {}

  @Post("holdings")
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
  async deleteHolding(
    @Param("id") id: string,
    @Param("companyId") companyId: string,
  ) {
    return this.registryService.deleteHolding(id, companyId);
  }

  @Put(":id/holding")
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
