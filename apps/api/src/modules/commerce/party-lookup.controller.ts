import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { PartyLookupRequestDto } from "./dto/party-lookup.dto";
import { PartyLookupService } from "./services/party-lookup.service";

@Controller()
export class PartyLookupController {
  constructor(private readonly partyLookupService: PartyLookupService) {}

  @UseGuards(JwtAuthGuard)
  @Post("party-lookup")
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
