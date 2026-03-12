import { Controller, Get, Param, Query, Request } from "@nestjs/common";
import { IdentificationSchemaQueryDto } from "./dto/identification-schema.dto";
import { IdentificationSchemaService } from "./services/identification-schema.service";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { REGULATORY_ROLES } from "../../shared/auth/rbac.constants";

@Controller()
export class IdentificationSchemaController {
  constructor(
    private readonly identificationSchemaService: IdentificationSchemaService,
  ) {}

  @Get("jurisdictions/:jurisdictionId/identification-schema")
  @Authorized(...REGULATORY_ROLES)
  getSchema(
    @Request() req: any,
    @Param("jurisdictionId") jurisdictionId: string,
    @Query() query: IdentificationSchemaQueryDto,
  ) {
    return this.identificationSchemaService.getSchema(
      req.user.companyId,
      jurisdictionId,
      query.partyType,
    );
  }
}
