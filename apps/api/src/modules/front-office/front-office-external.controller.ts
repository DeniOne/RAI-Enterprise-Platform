import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import { User, UserRole } from "@rai/prisma-client";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { IdempotencyInterceptor } from "../../shared/idempotency/idempotency.interceptor";
import { FrontOfficeService } from "./front-office.service";

type AuthenticatedFrontOfficeViewer = Partial<User> & {
  userId?: string;
  companyId?: string;
  role?: string;
  accountId?: string | null;
};

@Controller("portal/front-office")
export class FrontOfficeExternalController {
  constructor(private readonly frontOfficeService: FrontOfficeService) {}

  private getCompanyId(user: AuthenticatedFrontOfficeViewer): string {
    return String(user.companyId ?? "");
  }

  private getUserId(user: AuthenticatedFrontOfficeViewer): string {
    return String(user.userId ?? user.id ?? "");
  }

  private getViewer(user: AuthenticatedFrontOfficeViewer) {
    return {
      id: this.getUserId(user),
      role: user.role,
      accountId: user.accountId ?? null,
    };
  }

  private normalizeLimit(value?: string): number | undefined {
    if (!value) {
      return undefined;
    }
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return undefined;
    }
    return Math.min(Math.max(parsed, 1), 300);
  }

  @Get("threads")
  @Authorized(UserRole.FRONT_OFFICE_USER)
  async listThreads(@CurrentUser() user: AuthenticatedFrontOfficeViewer) {
    return this.frontOfficeService.listThreadsForViewer(
      this.getCompanyId(user),
      this.getViewer(user),
    );
  }

  @Get("threads/:threadKey")
  @Authorized(UserRole.FRONT_OFFICE_USER)
  async getThread(
    @CurrentUser() user: AuthenticatedFrontOfficeViewer,
    @Param("threadKey") threadKey: string,
  ) {
    return this.frontOfficeService.getThreadForViewer(
      this.getCompanyId(user),
      this.getViewer(user),
      threadKey,
    );
  }

  @Get("threads/:threadKey/messages")
  @Authorized(UserRole.FRONT_OFFICE_USER)
  async listMessages(
    @CurrentUser() user: AuthenticatedFrontOfficeViewer,
    @Param("threadKey") threadKey: string,
    @Query("afterId") afterId?: string,
    @Query("limit") limit?: string,
  ) {
    return this.frontOfficeService.listMessagesForViewer(
      this.getCompanyId(user),
      this.getViewer(user),
      threadKey,
      {
        afterId,
        limit: this.normalizeLimit(limit),
      },
    );
  }

  @Post("intake/message")
  @Authorized(UserRole.FRONT_OFFICE_USER)
  @UseInterceptors(IdempotencyInterceptor)
  async intakeMessage(
    @CurrentUser() user: AuthenticatedFrontOfficeViewer,
    @Body()
    body: {
      messageText: string;
      threadExternalId?: string;
      dialogExternalId?: string;
      sourceMessageId?: string;
      route?: string;
    },
  ) {
    return this.frontOfficeService.intakeMessageForViewer(
      this.getCompanyId(user),
      this.getViewer(user),
      {
        messageText: body.messageText,
        threadExternalId: body.threadExternalId,
        dialogExternalId: body.dialogExternalId,
        sourceMessageId: body.sourceMessageId,
        route: body.route,
      },
    );
  }

  @Post("threads/:threadKey/reply")
  @Authorized(UserRole.FRONT_OFFICE_USER)
  @UseInterceptors(IdempotencyInterceptor)
  async replyToThread(
    @CurrentUser() user: AuthenticatedFrontOfficeViewer,
    @Param("threadKey") threadKey: string,
    @Body() body: { messageText: string },
  ) {
    return this.frontOfficeService.replyToThread(
      this.getCompanyId(user),
      this.getViewer(user),
      threadKey,
      body.messageText,
    );
  }

  @Post("threads/:threadKey/read")
  @Authorized(UserRole.FRONT_OFFICE_USER)
  @UseInterceptors(IdempotencyInterceptor)
  async markThreadRead(
    @CurrentUser() user: AuthenticatedFrontOfficeViewer,
    @Param("threadKey") threadKey: string,
    @Body() body: { lastMessageId?: string },
  ) {
    return this.frontOfficeService.markThreadRead(
      this.getCompanyId(user),
      this.getViewer(user),
      threadKey,
      body.lastMessageId,
    );
  }
}
