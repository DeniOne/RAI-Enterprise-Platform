import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Put,
    UseGuards
} from "@nestjs/common";
import { CrmService } from "./crm.service";
// Assuming internal tenant/user extraction from req. user decorator is standard in this project
// For now using simple placeholders for companyId or waiting for JwtAuthGuard if standard

@Controller("crm")
export class CrmController {
    constructor(private readonly crmService: CrmService) { }

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
        @Body() body: { name: string; inn?: string; type?: string; holdingId?: string; companyId: string },
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
    async getAccounts(@Param("companyId") companyId: string) {
        return this.crmService.getAccounts(companyId);
    }

    @Get("accounts/:id/details/:companyId")
    async getAccountDetails(
        @Param("id") id: string,
        @Param("companyId") companyId: string
    ) {
        return this.crmService.getAccountDetails(id, companyId);
    }
}
