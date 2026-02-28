import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { CreatePartyDto, CreatePartyRelationDto } from "./dto/create-party.dto";
import { CreateAssetRoleDto, CreateFarmDto } from "./dto/asset-role.dto";
import { PartyService } from "./services/party.service";
import { AssetRoleService } from "./services/asset-role.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class PartyAssetsController {
  constructor(
    private readonly partyService: PartyService,
    private readonly assetRoleService: AssetRoleService,
  ) {}

  @Get("parties")
  listParties(@Request() req: any) {
    return this.partyService.listParties(req.user.companyId);
  }

  @Post("parties")
  createParty(@Request() req: any, @Body() dto: CreatePartyDto) {
    return this.partyService.createParty(req.user.companyId, dto);
  }

  @Get("parties/:id")
  getParty(@Request() req: any, @Param("id") partyId: string) {
    return this.partyService.getParty(req.user.companyId, partyId);
  }

  @Get("parties/:id/relations")
  listPartyRelations(@Request() req: any, @Param("id") partyId: string) {
    return this.partyService.listPartyRelations(req.user.companyId, partyId);
  }

  @Post("party-relations")
  createPartyRelation(@Request() req: any, @Body() dto: CreatePartyRelationDto) {
    return this.partyService.createPartyRelation(req.user.companyId, dto);
  }

  @Get("parties/:id/assets")
  listPartyAssets(@Request() req: any, @Param("id") partyId: string) {
    return this.assetRoleService.listPartyAssets(req.user.companyId, partyId);
  }

  @Get("assets/farms")
  listFarms(
    @Request() req: any,
    @Query("q") q?: string,
    @Query("holdingId") holdingId?: string,
    @Query("operatorId") operatorId?: string,
    @Query("hasLease") hasLease?: string,
  ) {
    return this.assetRoleService.listFarms(req.user.companyId, {
      q,
      holdingId,
      operatorId,
      hasLease: hasLease === undefined ? undefined : String(hasLease).toLowerCase() === "true",
    });
  }

  @Post("assets/farms")
  createFarm(@Request() req: any, @Body() dto: CreateFarmDto) {
    return this.assetRoleService.createFarm(req.user.companyId, dto);
  }

  @Get("assets/farms/:id")
  getFarm(@Request() req: any, @Param("id") farmId: string) {
    return this.assetRoleService.getFarm(req.user.companyId, farmId);
  }

  @Get("assets/farms/:id/fields")
  getFarmFields(@Request() req: any, @Param("id") farmId: string) {
    return this.assetRoleService.getFarmFields(req.user.companyId, farmId);
  }

  @Get("assets/:id/roles")
  getAssetRoles(@Request() req: any, @Param("id") assetId: string) {
    return this.assetRoleService.listAssetRoles(req.user.companyId, assetId);
  }

  @Post("assets/:id/roles")
  createAssetRole(
    @Request() req: any,
    @Param("id") assetId: string,
    @Body() dto: CreateAssetRoleDto,
  ) {
    return this.assetRoleService.createAssetRole(req.user.companyId, assetId, dto);
  }
}
