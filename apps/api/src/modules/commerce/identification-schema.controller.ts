import { Controller, Get, Param, Query, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { IdentificationSchemaQueryDto } from "./dto/identification-schema.dto";
import { IdentificationSchemaService } from "./services/identification-schema.service";

@Controller()
export class IdentificationSchemaController {
  constructor(
    private readonly identificationSchemaService: IdentificationSchemaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("jurisdictions/:jurisdictionId/identification-schema")
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
