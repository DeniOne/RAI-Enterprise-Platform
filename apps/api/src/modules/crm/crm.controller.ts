import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Patch,
  UseGuards,
  Query,
} from "@nestjs/common";
import { CrmService } from "./crm.service";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
// Assuming internal tenant/user extraction from req. user decorator is standard in this project
// For now using simple placeholders for companyId or waiting for JwtAuthGuard if standard

@Controller("crm")
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // --- Holdings ---

  @Post("holdings")
  async createHolding(
    @Body() body: { name: string; description?: string; companyId: string },
  ) {
    // In production, companyId comes from JWT
    return this.crmService.createHolding(body, body.companyId);
  }

  @Get("holdings/:companyId")
  async getAllHoldings(@Param("companyId") companyId: string) {
    return this.crmService.findAllHoldings(companyId);
  }

  @Get("holdings/:id/:companyId")
  async getHolding(
    @Param("id") id: string,
    @Param("companyId") companyId: string,
  ) {
    return this.crmService.findOneHolding(id, companyId);
  }

  @Delete("holdings/:id/:companyId")
  async deleteHolding(
    @Param("id") id: string,
    @Param("companyId") companyId: string,
  ) {
    return this.crmService.deleteHolding(id, companyId);
  }

  // --- Accounts ---

  @Post("accounts")
  async createAccount(
    @Body()
    body: {
      name: string;
      inn?: string;
      type?: string;
      holdingId?: string;
      companyId: string;
    },
  ) {
    return this.crmService.createAccount(body, body.companyId);
  }

  @Put("accounts/:id/holding")
  async linkToHolding(
    @Param("id") id: string,
    @Body() body: { holdingId: string | null; companyId: string },
  ) {
    return this.crmService.updateAccountHolding(
      id,
      body.holdingId,
      body.companyId,
    );
  }

  @Get("accounts/:companyId")
  async getAccounts(
    @Param("companyId") companyId: string,
    @Query("search") search?: string,
    @Query("type") type?: string,
    @Query("status") status?: string,
    @Query("riskCategory") riskCategory?: string,
    @Query("responsibleId") responsibleId?: string,
  ) {
    return this.crmService.getAccounts(companyId, {
      search,
      type,
      status,
      riskCategory,
      responsibleId,
    });
  }

  @Get("accounts/:id/workspace")
  async getAccountWorkspace(
    @Param("id") id: string,
    @Query("companyId") companyId: string,
  ) {
    return this.crmService.getAccountWorkspace(id, companyId);
  }

  @Get("accounts/:id/details/:companyId")
  async getAccountDetails(
    @Param("id") id: string,
    @Param("companyId") companyId: string,
  ) {
    return this.crmService.getAccountDetails(id, companyId);
  }

  @Patch("accounts/:id")
  async updateAccount(
    @Param("id") id: string,
    @Body()
    body: {
      companyId: string;
      name?: string;
      inn?: string | null;
      type?: string;
      status?: string;
      holdingId?: string | null;
      jurisdiction?: string | null;
      riskCategory?: string;
      strategicValue?: string;
    },
  ) {
    return this.crmService.updateAccountProfile(id, body.companyId, body);
  }

  @Post("accounts/:id/contacts")
  async createContact(
    @Param("id") accountId: string,
    @Body()
    body: {
      companyId: string;
      firstName: string;
      lastName?: string;
      role?: string;
      influenceLevel?: number;
      email?: string;
      phone?: string;
      source?: string;
    },
  ) {
    return this.crmService.createContact(accountId, body.companyId, body);
  }

  @Patch("contacts/:contactId")
  async updateContact(
    @Param("contactId") contactId: string,
    @Body()
    body: {
      companyId: string;
      firstName?: string;
      lastName?: string | null;
      role?: string;
      influenceLevel?: number | null;
      email?: string | null;
      phone?: string | null;
      source?: string | null;
    },
  ) {
    return this.crmService.updateContact(contactId, body.companyId, body);
  }

  @Delete("contacts/:contactId")
  async deleteContact(
    @Param("contactId") contactId: string,
    @Query("companyId") companyId: string,
  ) {
    return this.crmService.deleteContact(contactId, companyId);
  }

  @Post("accounts/:id/interactions")
  async createInteraction(
    @Param("id") accountId: string,
    @Body()
    body: {
      companyId: string;
      type: string;
      summary: string;
      date?: string;
      contactId?: string | null;
      relatedEventId?: string | null;
    },
  ) {
    return this.crmService.createInteraction(accountId, body.companyId, body);
  }

  @Patch("interactions/:interactionId")
  async updateInteraction(
    @Param("interactionId") interactionId: string,
    @Body()
    body: {
      companyId: string;
      type?: string;
      summary?: string;
      date?: string;
      contactId?: string | null;
      relatedEventId?: string | null;
    },
  ) {
    return this.crmService.updateInteraction(
      interactionId,
      body.companyId,
      body,
    );
  }

  @Delete("interactions/:interactionId")
  async deleteInteraction(
    @Param("interactionId") interactionId: string,
    @Query("companyId") companyId: string,
  ) {
    return this.crmService.deleteInteraction(interactionId, companyId);
  }

  @Post("accounts/:id/obligations")
  async createObligation(
    @Param("id") accountId: string,
    @Body()
    body: {
      companyId: string;
      description: string;
      dueDate: string;
      responsibleUserId?: string | null;
      status?: string;
    },
  ) {
    return this.crmService.createObligation(accountId, body.companyId, body);
  }

  @Patch("obligations/:obligationId")
  async updateObligation(
    @Param("obligationId") obligationId: string,
    @Body()
    body: {
      companyId: string;
      description?: string;
      dueDate?: string;
      responsibleUserId?: string | null;
      status?: string;
    },
  ) {
    return this.crmService.updateObligation(obligationId, body.companyId, body);
  }

  @Delete("obligations/:obligationId")
  async deleteObligation(
    @Param("obligationId") obligationId: string,
    @Query("companyId") companyId: string,
  ) {
    return this.crmService.deleteObligation(obligationId, companyId);
  }

  // --- Farm Map (Entity Workspace) ---
  @Get("farms/registry/:companyId")
  async getFarmsRegistry(
    @Param("companyId") companyId: string,
    @Query("search") search?: string,
    @Query("severity") severity?: string,
    @Query("sort") sort?: string,
    @Query("onlyRisk") onlyRisk?: string,
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
  ) {
    const normalizedSeverity = ["ok", "warning", "critical"].includes(
      String(severity || "").toLowerCase(),
    )
      ? String(severity).toLowerCase()
      : undefined;
    const normalizedSort = [
      "plans_desc",
      "plans_asc",
      "active_desc",
      "active_asc",
      "name_asc",
      "name_desc",
    ].includes(String(sort || "").toLowerCase())
      ? String(sort).toLowerCase()
      : "plans_desc";
    const normalizedPage = Number.isFinite(Number(page)) ? Number(page) : 1;
    const normalizedPageSize = Number.isFinite(Number(pageSize))
      ? Number(pageSize)
      : 20;

    return this.crmService.getFarmsRegistry(companyId, {
      search,
      severity: normalizedSeverity,
      sort: normalizedSort,
      onlyRisk: String(onlyRisk || "").toLowerCase() === "true",
      page: normalizedPage,
      pageSize: normalizedPageSize,
    });
  }

  @Get("farms/:farmId/map/:companyId")
  async getFarmMap(
    @Param("farmId") farmId: string,
    @Param("companyId") companyId: string,
  ) {
    return this.crmService.getFarmMap(farmId, companyId);
  }
}
