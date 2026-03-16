import {
  Body,
  Controller,
  Post,
  Request,
} from "@nestjs/common";
import { BankLookupRequestDto } from "./dto/bank-lookup.dto";
import { PartyLookupRequestDto } from "./dto/party-lookup.dto";
import { BankLookupService } from "./services/bank-lookup.service";
import { PartyLookupService } from "./services/party-lookup.service";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { PARTY_LOOKUP_ROLES } from "../../shared/auth/rbac.constants";

@Controller()
export class PartyLookupController {
  constructor(
    private readonly partyLookupService: PartyLookupService,
    private readonly bankLookupService: BankLookupService,
  ) {}

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

  @Post("bank-lookup")
  @Authorized(...PARTY_LOOKUP_ROLES)
  lookupBank(@Request() req: any, @Body() dto: BankLookupRequestDto) {
    return this.bankLookupService.lookup({
      companyId: req.user.companyId,
      userId: req.user.userId || req.user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      request: dto,
    });
  }
}
