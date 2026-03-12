import {
  Body,
  Controller,
  Post,
  Request,
} from "@nestjs/common";
import { PartyLookupRequestDto } from "./dto/party-lookup.dto";
import { PartyLookupService } from "./services/party-lookup.service";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { PARTY_LOOKUP_ROLES } from "../../shared/auth/rbac.constants";

@Controller()
export class PartyLookupController {
  constructor(private readonly partyLookupService: PartyLookupService) {}

  @Post("party-lookup")
  @Authorized(...PARTY_LOOKUP_ROLES)
  lookup(@Request() req: any, @Body() dto: PartyLookupRequestDto) {
    return this.partyLookupService.lookup({
      companyId: req.user.companyId,
      userId: req.user.userId || req.user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      request: dto,
    });
  }
}
