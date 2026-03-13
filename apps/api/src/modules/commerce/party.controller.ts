import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseInterceptors } from "@nestjs/common";
import { PartyService } from "./services/party.service";
import { CreatePartyDto, UpdatePartyDto, CreatePartyRelationDto, UpdatePartyRelationDto } from "../../shared/commerce/dto/create-party.dto";
import { CreateJurisdictionDto, UpdateJurisdictionDto } from "../../shared/commerce/dto/create-jurisdiction.dto";
import {
    CreateRegulatoryProfileDto,
    UpdateRegulatoryProfileDto,
    ListRegulatoryProfilesQueryDto,
} from "../../shared/commerce/dto/create-regulatory-profile.dto";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../shared/auth/authorized.decorator";
import {
    COMMERCE_READ_ROLES,
    COMMERCE_WRITE_ROLES,
    REGULATORY_ROLES,
} from "../../shared/auth/rbac.constants";

@Controller("commerce")
export class PartyController {
    constructor(private readonly partyService: PartyService) { }

    // ─── Tenant Discovery (public, no JWT) ──────────────────────

    @Get("tenant")
    getDefaultTenant() {
        return this.partyService.getDefaultTenant();
    }

    // ─── Jurisdictions ──────────────────────────────────────────

    @Get("jurisdictions")
    @Authorized(...REGULATORY_ROLES)
    listJurisdictions(@Request() req: any) {
        return this.partyService.listJurisdictions(req.user.companyId);
    }

    @Post("jurisdictions")
    @Authorized(...REGULATORY_ROLES)
    @UseInterceptors(IdempotencyInterceptor)
    createJurisdiction(@Request() req: any, @Body() dto: CreateJurisdictionDto) {
        return this.partyService.createJurisdiction(req.user.companyId, dto);
    }

    @Patch("jurisdictions/:id")
    @Authorized(...REGULATORY_ROLES)
    @UseInterceptors(IdempotencyInterceptor)
    updateJurisdiction(
        @Request() req: any,
        @Param("id") jurisdictionId: string,
        @Body() dto: UpdateJurisdictionDto,
    ) {
        return this.partyService.updateJurisdiction(req.user.companyId, jurisdictionId, dto);
    }

    @Delete("jurisdictions/:id")
    @Authorized(...REGULATORY_ROLES)
    deleteJurisdiction(@Request() req: any, @Param("id") jurisdictionId: string) {
        return this.partyService.deleteJurisdiction(req.user.companyId, jurisdictionId);
    }

    // ─── Regulatory Profiles ────────────────────────────────────

    @Get("regulatory-profiles")
    @Authorized(...REGULATORY_ROLES)
    listRegulatoryProfiles(
        @Request() req: any,
        @Query() query: ListRegulatoryProfilesQueryDto,
    ) {
        // Нормализуем булевые query-params (из строки в boolean)
        const normalized = {
            ...query,
            isSystemPreset: query.isSystemPreset !== undefined
                ? String(query.isSystemPreset) === "true"
                : undefined,
        };
        return this.partyService.listRegulatoryProfiles(req.user.companyId, normalized);
    }

    @Post("regulatory-profiles")
    @Authorized(...REGULATORY_ROLES)
    @UseInterceptors(IdempotencyInterceptor)
    createRegulatoryProfile(@Request() req: any, @Body() dto: CreateRegulatoryProfileDto) {
        return this.partyService.createRegulatoryProfile(req.user.companyId, dto);
    }

    @Patch("regulatory-profiles/:id")
    @Authorized(...REGULATORY_ROLES)
    @UseInterceptors(IdempotencyInterceptor)
    updateRegulatoryProfile(
        @Request() req: any,
        @Param("id") profileId: string,
        @Body() dto: UpdateRegulatoryProfileDto,
    ) {
        return this.partyService.updateRegulatoryProfile(req.user.companyId, profileId, dto);
    }

    @Delete("regulatory-profiles/:id")
    @Authorized(...REGULATORY_ROLES)
    deleteRegulatoryProfile(@Request() req: any, @Param("id") profileId: string) {
        return this.partyService.deleteRegulatoryProfile(req.user.companyId, profileId);
    }

    // ─── Parties ────────────────────────────────────────────────

    @Get("parties")
    @Authorized(...COMMERCE_READ_ROLES)
    listParties(@Request() req: any) {
        return this.partyService.listParties(req.user.companyId);
    }

    @Get("parties/:id")
    @Authorized(...COMMERCE_READ_ROLES)
    getParty(@Request() req: any, @Param("id") partyId: string) {
        return this.partyService.getParty(req.user.companyId, partyId);
    }

    @Post("parties")
    @Authorized(...COMMERCE_WRITE_ROLES)
    @UseInterceptors(IdempotencyInterceptor)
    createParty(@Request() req: any, @Body() dto: CreatePartyDto) {
        return this.partyService.createParty(req.user.companyId, dto);
    }

    @Patch("parties/:id")
    @Authorized(...COMMERCE_WRITE_ROLES)
    @UseInterceptors(IdempotencyInterceptor)
    updateParty(
        @Request() req: any,
        @Param("id") partyId: string,
        @Body() dto: UpdatePartyDto,
    ) {
        return this.partyService.updateParty(req.user.companyId, partyId, dto);
    }

    // ─── Party Relations ────────────────────────────────────────

    @Get("parties/:id/relations")
    @Authorized(...COMMERCE_READ_ROLES)
    listPartyRelations(
        @Request() req: any,
        @Param("id") partyId: string,
    ) {
        return this.partyService.listPartyRelations(req.user.companyId, partyId);
    }

    @Post("party-relations")
    @Authorized(...COMMERCE_WRITE_ROLES)
    @UseInterceptors(IdempotencyInterceptor)
    createPartyRelation(@Request() req: any, @Body() dto: CreatePartyRelationDto) {
        return this.partyService.createPartyRelation(req.user.companyId, dto);
    }

    @Patch("party-relations/:id")
    @Authorized(...COMMERCE_WRITE_ROLES)
    @UseInterceptors(IdempotencyInterceptor)
    updatePartyRelation(
        @Request() req: any,
        @Param("id") relationId: string,
        @Body() dto: UpdatePartyRelationDto,
    ) {
        return this.partyService.updatePartyRelation(req.user.companyId, relationId, dto);
    }

    @Delete("party-relations/:id")
    @Authorized(...COMMERCE_WRITE_ROLES)
    deletePartyRelation(@Request() req: any, @Param("id") relationId: string) {
        return this.partyService.deletePartyRelation(req.user.companyId, relationId);
    }
}
