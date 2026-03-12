import { Body, Controller, Post, UseInterceptors } from "@nestjs/common";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import {
  CommitAgroEventDto,
  ConfirmAgroEventDto,
  CreateAgroEventDraftDto,
  FixAgroEventDto,
  LinkAgroEventDto,
} from "./dto/agro-events.dto";
import { AgroEventsService } from "./agro-events.service";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { EXECUTION_ROLES } from "../../shared/auth/rbac.constants";

@Controller("agro-events")
@Authorized(...EXECUTION_ROLES)
export class AgroEventsController {
  constructor(private readonly agroEventsService: AgroEventsService) {}

  @Post("drafts")
  @UseInterceptors(IdempotencyInterceptor)
  async createDraft(
    @CurrentUser() user: any,
    @Body() dto: CreateAgroEventDraftDto,
  ) {
    return this.agroEventsService.createDraft(user, dto);
  }

  @Post("fix")
  @UseInterceptors(IdempotencyInterceptor)
  async fix(@CurrentUser() user: any, @Body() dto: FixAgroEventDto) {
    return this.agroEventsService.fix(user, dto);
  }

  @Post("link")
  @UseInterceptors(IdempotencyInterceptor)
  async link(@CurrentUser() user: any, @Body() dto: LinkAgroEventDto) {
    return this.agroEventsService.link(user, dto);
  }

  @Post("confirm")
  @UseInterceptors(IdempotencyInterceptor)
  async confirm(
    @CurrentUser() user: any,
    @Body() dto: ConfirmAgroEventDto,
  ) {
    return this.agroEventsService.confirm(user, dto);
  }

  @Post("commit")
  @UseInterceptors(IdempotencyInterceptor)
  async commit(@CurrentUser() user: any, @Body() dto: CommitAgroEventDto) {
    return this.agroEventsService.commit(user, dto);
  }
}
