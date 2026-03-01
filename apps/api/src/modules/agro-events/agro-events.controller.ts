import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import {
  CommitAgroEventDto,
  ConfirmAgroEventDto,
  CreateAgroEventDraftDto,
  FixAgroEventDto,
  LinkAgroEventDto,
} from "./dto/agro-events.dto";
import { AgroEventsService } from "./agro-events.service";

@Controller("agro-events")
@UseGuards(JwtAuthGuard)
export class AgroEventsController {
  constructor(private readonly agroEventsService: AgroEventsService) {}

  @Post("drafts")
  async createDraft(
    @CurrentUser() user: any,
    @Body() dto: CreateAgroEventDraftDto,
  ) {
    return this.agroEventsService.createDraft(user, dto);
  }

  @Post("fix")
  async fix(@CurrentUser() user: any, @Body() dto: FixAgroEventDto) {
    return this.agroEventsService.fix(user, dto);
  }

  @Post("link")
  async link(@CurrentUser() user: any, @Body() dto: LinkAgroEventDto) {
    return this.agroEventsService.link(user, dto);
  }

  @Post("confirm")
  async confirm(
    @CurrentUser() user: any,
    @Body() dto: ConfirmAgroEventDto,
  ) {
    return this.agroEventsService.confirm(user, dto);
  }

  @Post("commit")
  async commit(@CurrentUser() user: any, @Body() dto: CommitAgroEventDto) {
    return this.agroEventsService.commit(user, dto);
  }
}
