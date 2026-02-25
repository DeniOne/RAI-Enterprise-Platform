import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { PartyService } from "./services/party.service";
import { CreatePartyDto, UpdatePartyDto, CreatePartyRelationDto } from "./dto/create-party.dto";
import { CreateJurisdictionDto } from "./dto/create-jurisdiction.dto";
import { CreateRegulatoryProfileDto } from "./dto/create-regulatory-profile.dto";

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
    listJurisdictions(@Query("companyId") companyId: string) {
        return this.partyService.listJurisdictions(companyId);
    }

    @Post("jurisdictions")
    createJurisdiction(@Body() body: CreateJurisdictionDto & { companyId: string }) {
        const { companyId, ...dto } = body;
        return this.partyService.createJurisdiction(companyId, dto);
    }

    // ─── Regulatory Profiles ────────────────────────────────────

    @Get("regulatory-profiles")
    listRegulatoryProfiles(@Query("companyId") companyId: string) {
        return this.partyService.listRegulatoryProfiles(companyId);
    }

    @Post("regulatory-profiles")
    createRegulatoryProfile(@Body() body: CreateRegulatoryProfileDto & { companyId: string }) {
        const { companyId, ...dto } = body;
        return this.partyService.createRegulatoryProfile(companyId, dto);
    }

    // ─── Parties ────────────────────────────────────────────────

    @Get("parties")
    listParties(@Query("companyId") companyId: string) {
        return this.partyService.listParties(companyId);
    }

    @Get("parties/:id")
    getParty(@Param("id") partyId: string, @Query("companyId") companyId: string) {
        return this.partyService.getParty(companyId, partyId);
    }

    @Post("parties")
    createParty(@Body() body: CreatePartyDto & { companyId: string }) {
        const { companyId, ...dto } = body;
        return this.partyService.createParty(companyId, dto);
    }

    @Patch("parties/:id")
    updateParty(
        @Param("id") partyId: string,
        @Body() body: UpdatePartyDto & { companyId: string },
    ) {
        const { companyId, ...dto } = body;
        return this.partyService.updateParty(companyId, partyId, dto);
    }

    // ─── Party Relations ────────────────────────────────────────

    @Get("parties/:id/relations")
    listPartyRelations(
        @Param("id") partyId: string,
        @Query("companyId") companyId: string,
    ) {
        return this.partyService.listPartyRelations(companyId, partyId);
    }

    @Post("party-relations")
    createPartyRelation(@Body() body: CreatePartyRelationDto & { companyId: string }) {
        const { companyId, ...dto } = body;
        return this.partyService.createPartyRelation(companyId, dto);
    }
}
