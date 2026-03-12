import {
  Controller,
  Post,
  Body,
  Logger,
  BadRequestException,
  UseInterceptors,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { TenantContextService } from "../../shared/tenant-context/tenant-context.service";
import { RaiChatRequestDto, RaiChatResponseDto } from "./dto/rai-chat.dto";
import { RaiChatService } from "./rai-chat.service";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { INTERNAL_USER_ROLES } from "../../shared/auth/rbac.constants";

@Controller('rai/chat')
@Authorized(...INTERNAL_USER_ROLES)
export class RaiChatController {
  private readonly logger = new Logger(RaiChatController.name);

  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly raiChatService: RaiChatService,
  ) { }

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @UseInterceptors(IdempotencyInterceptor)
  async handleChat(
    @Body() body: RaiChatRequestDto,
    @CurrentUser() user: any,
  ): Promise<RaiChatResponseDto> {
    const companyId = this.tenantContext.getCompanyId();

    if (!companyId) {
      this.logger.error("Attempt to access RAI Chat without companyId");
      throw new BadRequestException("Security Context: companyId is missing");
    }

    const workspaceContextSummary = body.workspaceContext
      ? {
        route: body.workspaceContext.route,
        activeEntityRefsCount: body.workspaceContext.activeEntityRefs?.length ?? 0,
        activeEntityKinds:
          body.workspaceContext.activeEntityRefs?.map((ref) => ref.kind) ?? [],
        hasFilters: Boolean(body.workspaceContext.filters),
        hasSelectedRowSummary: Boolean(body.workspaceContext.selectedRowSummary),
        lastUserAction: body.workspaceContext.lastUserAction ?? null,
      }
      : null;

    this.logger.log(
      `RAI Chat message received for company: ${companyId}; workspaceContext=${JSON.stringify(
        workspaceContextSummary,
      )}`,
    );

    return this.raiChatService.handleChat(body, companyId, user?.userId);
  }
}
