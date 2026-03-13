import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseInterceptors } from "@nestjs/common";
import { CreatePartyDto, CreatePartyRelationDto, UpdatePartyRelationDto } from "../../shared/commerce/dto/create-party.dto";
import { CreateAssetRoleDto, CreateFarmDto, UpdateAssetRoleDto } from "./dto/asset-role.dto";
import { PartyService } from "./services/party.service";
import { AssetRoleService } from "./services/asset-role.service";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../shared/auth/authorized.decorator";
import {
  COMMERCE_READ_ROLES,
  COMMERCE_WRITE_ROLES,
} from "../../shared/auth/rbac.constants";

@Controller()
export class PartyAssetsController {
  constructor(
    private readonly partyService: PartyService,
    private readonly assetRoleService: AssetRoleService,
  ) {}

  @Get("parties")
  @Authorized(...COMMERCE_READ_ROLES)
  listParties(@Request() req: any) {
    return this.partyService.listParties(req.user.companyId);
  }

  @Post("parties")
  @Authorized(...COMMERCE_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  createParty(@Request() req: any, @Body() dto: CreatePartyDto) {
    return this.partyService.createParty(req.user.companyId, dto);
  }

  @Get("parties/:id")
  @Authorized(...COMMERCE_READ_ROLES)
  getParty(@Request() req: any, @Param("id") partyId: string) {
    return this.partyService.getParty(req.user.companyId, partyId);
  }

  @Get("parties/:id/relations")
  @Authorized(...COMMERCE_READ_ROLES)
  listPartyRelations(@Request() req: any, @Param("id") partyId: string) {
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

  @Get("parties/:id/assets")
  @Authorized(...COMMERCE_READ_ROLES)
  listPartyAssets(@Request() req: any, @Param("id") partyId: string) {
    return this.assetRoleService.listPartyAssets(req.user.companyId, partyId);
  }

  @Get("assets/farms")
  @Authorized(...COMMERCE_READ_ROLES)
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
  @Authorized(...COMMERCE_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  createFarm(@Request() req: any, @Body() dto: CreateFarmDto) {
    return this.assetRoleService.createFarm(req.user.companyId, dto);
  }

  @Get("assets/farms/:id")
  @Authorized(...COMMERCE_READ_ROLES)
  getFarm(@Request() req: any, @Param("id") farmId: string) {
    return this.assetRoleService.getFarm(req.user.companyId, farmId);
  }

  @Get("assets/farms/:id/fields")
  @Authorized(...COMMERCE_READ_ROLES)
  getFarmFields(@Request() req: any, @Param("id") farmId: string) {
    return this.assetRoleService.getFarmFields(req.user.companyId, farmId);
  }

  @Get("assets/fields")
  @Authorized(...COMMERCE_READ_ROLES)
  listFields(@Request() req: any) {
    return this.assetRoleService.listFields(req.user.companyId);
  }

  @Get("assets/objects")
  @Authorized(...COMMERCE_READ_ROLES)
  listObjects(@Request() req: any) {
    return this.assetRoleService.listObjects(req.user.companyId);
  }

  @Get("assets/:id/roles")
  @Authorized(...COMMERCE_READ_ROLES)
  getAssetRoles(@Request() req: any, @Param("id") assetId: string) {
    return this.assetRoleService.listAssetRoles(req.user.companyId, assetId);
  }

  @Post("assets/:id/roles")
  @Authorized(...COMMERCE_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  createAssetRole(
    @Request() req: any,
    @Param("id") assetId: string,
    @Body() dto: CreateAssetRoleDto,
  ) {
    return this.assetRoleService.createAssetRole(req.user.companyId, assetId, dto);
  }

  @Patch("assets/:id/roles/:roleId")
  @Authorized(...COMMERCE_WRITE_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  updateAssetRole(
    @Request() req: any,
    @Param("id") assetId: string,
    @Param("roleId") roleId: string,
    @Body() dto: UpdateAssetRoleDto,
  ) {
    return this.assetRoleService.updateAssetRole(req.user.companyId, assetId, roleId, dto);
  }

  @Delete("assets/:id/roles/:roleId")
  @Authorized(...COMMERCE_WRITE_ROLES)
  deleteAssetRole(
    @Request() req: any,
    @Param("id") assetId: string,
    @Param("roleId") roleId: string,
  ) {
    return this.assetRoleService.deleteAssetRole(req.user.companyId, assetId, roleId);
  }
}
