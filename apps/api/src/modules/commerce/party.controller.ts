import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Request } from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { PartyService } from "./services/party.service";
import { CreatePartyDto, UpdatePartyDto, CreatePartyRelationDto } from "./dto/create-party.dto";
import { CreateJurisdictionDto, UpdateJurisdictionDto } from "./dto/create-jurisdiction.dto";
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

    @UseGuards(JwtAuthGuard)
    @Get("jurisdictions")
    listJurisdictions(@Request() req: any) {
        return this.partyService.listJurisdictions(req.user.companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Post("jurisdictions")
    createJurisdiction(@Request() req: any, @Body() dto: CreateJurisdictionDto) {
        return this.partyService.createJurisdiction(req.user.companyId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch("jurisdictions/:id")
    updateJurisdiction(
        @Request() req: any,
        @Param("id") jurisdictionId: string,
        @Body() dto: UpdateJurisdictionDto,
    ) {
        return this.partyService.updateJurisdiction(req.user.companyId, jurisdictionId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete("jurisdictions/:id")
    deleteJurisdiction(@Request() req: any, @Param("id") jurisdictionId: string) {
        return this.partyService.deleteJurisdiction(req.user.companyId, jurisdictionId);
    }

    // ─── Regulatory Profiles ────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get("regulatory-profiles")
    listRegulatoryProfiles(@Request() req: any) {
        return this.partyService.listRegulatoryProfiles(req.user.companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Post("regulatory-profiles")
    createRegulatoryProfile(@Request() req: any, @Body() dto: CreateRegulatoryProfileDto) {
        return this.partyService.createRegulatoryProfile(req.user.companyId, dto);
    }

    // ─── Parties ────────────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get("parties")
    listParties(@Request() req: any) {
        return this.partyService.listParties(req.user.companyId);
    }

    @UseGuards(JwtAuthGuard)
    @Get("parties/:id")
    getParty(@Request() req: any, @Param("id") partyId: string) {
        return this.partyService.getParty(req.user.companyId, partyId);
    }

    @UseGuards(JwtAuthGuard)
    @Post("parties")
    createParty(@Request() req: any, @Body() dto: CreatePartyDto) {
        return this.partyService.createParty(req.user.companyId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch("parties/:id")
    updateParty(
        @Request() req: any,
        @Param("id") partyId: string,
        @Body() dto: UpdatePartyDto,
    ) {
        return this.partyService.updateParty(req.user.companyId, partyId, dto);
    }

    // ─── Party Relations ────────────────────────────────────────

    @UseGuards(JwtAuthGuard)
    @Get("parties/:id/relations")
    listPartyRelations(
        @Request() req: any,
        @Param("id") partyId: string,
    ) {
        return this.partyService.listPartyRelations(req.user.companyId, partyId);
    }

    @UseGuards(JwtAuthGuard)
    @Post("party-relations")
    createPartyRelation(@Request() req: any, @Body() dto: CreatePartyRelationDto) {
        return this.partyService.createPartyRelation(req.user.companyId, dto);
    }
}
