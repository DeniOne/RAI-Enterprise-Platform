import {
  Body,
  Controller,
  Get,
  Param,
  Post,
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
  ) {
    return this.frontOfficeService.listMessagesForViewer(
      this.getCompanyId(user),
      this.getViewer(user),
      threadKey,
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
