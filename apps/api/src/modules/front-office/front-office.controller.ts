import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User, UserRole } from "@rai/prisma-client";
import { FrontOfficeService } from "./front-office.service";
import { AgroOrchestratorService } from "../agro-orchestrator/agro-orchestrator.service";
import { Roles } from "../../shared/auth/roles.decorator";
import { RolesGuard } from "../../shared/auth/roles.guard";

type AuthenticatedUser = Partial<User> & {
  userId?: string;
  companyId?: string;
  role?: string;
  accountId?: string | null;
};

@Controller("front-office")
@UseGuards(JwtAuthGuard)
export class FrontOfficeController {
  constructor(
    private readonly frontOfficeService: FrontOfficeService,
    private readonly orchestratorService: AgroOrchestratorService,
  ) {}

  private getCompanyId(user: AuthenticatedUser): string {
    return String(user.companyId ?? "");
  }

  private getUserId(user: AuthenticatedUser): string {
    return String(user.userId ?? user.id ?? "");
  }

  @Get("overview")
  async getOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.frontOfficeService.getOverview(
      this.getCompanyId(user),
      this.getUserId(user),
    );
  }

  @Get("deviations")
  async listDeviations(@CurrentUser() user: AuthenticatedUser) {
    return this.frontOfficeService.listDeviations(this.getCompanyId(user));
  }

  @Post("deviations")
  async createDeviation(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      messageText: string;
      taskId?: string;
      fieldId?: string;
      seasonId?: string;
      photoUrl?: string;
      voiceUrl?: string;
      coordinates?: any;
      telemetryJson?: any;
      channel?: "telegram" | "web_chat" | "internal";
      sourceMessageId?: string;
      chatId?: string;
    },
  ) {
    return this.frontOfficeService.createDeviation(
      this.getCompanyId(user),
      this.getUserId(user),
      body,
    );
  }

  @Get("consultations")
  async listConsultations(@CurrentUser() user: AuthenticatedUser) {
    return this.frontOfficeService.listConsultations(this.getCompanyId(user));
  }

  @Post("consultations")
  async createConsultation(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      messageText: string;
      taskId?: string;
      fieldId?: string;
      seasonId?: string;
      traceId?: string;
      channel?: string;
      sourceMessageId?: string;
      chatId?: string;
      photoUrl?: string;
      voiceUrl?: string;
      coordinates?: any;
    },
  ) {
    return this.frontOfficeService.createConsultation(
      this.getCompanyId(user),
      this.getUserId(user),
      body,
    );
  }

  @Get("context-updates")
  async listContextUpdates(@CurrentUser() user: AuthenticatedUser) {
    return this.frontOfficeService.listContextUpdates(this.getCompanyId(user));
  }

  @Post("context-updates")
  async createContextUpdate(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      messageText: string;
      taskId?: string;
      fieldId?: string;
      seasonId?: string;
      traceId?: string;
      channel?: string;
      sourceMessageId?: string;
      chatId?: string;
      photoUrl?: string;
      voiceUrl?: string;
      coordinates?: any;
      telemetryJson?: any;
    },
  ) {
    return this.frontOfficeService.createContextUpdate(
      this.getCompanyId(user),
      this.getUserId(user),
      body,
    );
  }

  @Post("intake/classify")
  async classify(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      channel: "telegram" | "web_chat" | "internal";
      messageText: string;
      direction?: "inbound" | "outbound";
      threadExternalId?: string;
      dialogExternalId?: string;
      senderExternalId?: string;
      recipientExternalId?: string;
      route?: string;
      targetOwnerRole?: string;
      traceId?: string;
    },
  ) {
    return this.frontOfficeService.classifyMessage(
      this.getCompanyId(user),
      body.traceId ?? `fo-classify:${Date.now()}`,
      {
        ...body,
        userId: this.getUserId(user),
        userRole: user.role,
      },
    );
  }

  @Post("intake/message")
  async intake(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      channel: "telegram" | "web_chat" | "internal";
      messageText: string;
      direction?: "inbound" | "outbound";
      threadExternalId?: string;
      dialogExternalId?: string;
      senderExternalId?: string;
      recipientExternalId?: string;
      route?: string;
      targetOwnerRole?: string;
      taskId?: string;
      fieldId?: string;
      seasonId?: string;
      sourceMessageId?: string;
      chatId?: string;
      photoUrl?: string;
      voiceUrl?: string;
      coordinates?: any;
      telemetryJson?: any;
      traceId?: string;
    },
  ) {
    return this.frontOfficeService.intakeMessage(
      this.getCompanyId(user),
      body.traceId ?? `fo-intake:${Date.now()}`,
      { id: this.getUserId(user), role: user.role },
      body,
    );
  }

  @Get("queues")
  async getQueues(@CurrentUser() user: AuthenticatedUser) {
    return this.frontOfficeService.getQueues(this.getCompanyId(user));
  }

  @Get("manager/bootstrap")
  async getManagerBootstrap(@CurrentUser() user: AuthenticatedUser) {
    return this.frontOfficeService.getTelegramWorkspaceBootstrap(
      this.getCompanyId(user),
      this.getUserId(user),
    );
  }

  @Get("manager/farms")
  async listManagerFarms(@CurrentUser() user: AuthenticatedUser) {
    return this.frontOfficeService.listManagerFarms(
      this.getCompanyId(user),
      this.getUserId(user),
    );
  }

  @Get("manager/farms/:farmId/threads")
  async listManagerFarmThreads(
    @CurrentUser() user: AuthenticatedUser,
    @Param("farmId") farmId: string,
  ) {
    return this.frontOfficeService.listManagerFarmThreads(
      this.getCompanyId(user),
      this.getUserId(user),
      farmId,
    );
  }

  @Get("threads")
  async listThreads(@CurrentUser() user: AuthenticatedUser) {
    return this.frontOfficeService.listThreads(this.getCompanyId(user));
  }

  @Get("threads/:threadKey/messages")
  async listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param("threadKey") threadKey: string,
  ) {
    return this.frontOfficeService.listMessagesForViewer(
      this.getCompanyId(user),
      {
        id: this.getUserId(user),
        role: user.role,
        accountId: user.accountId ?? null,
      },
      threadKey,
    );
  }

  @Get("drafts/:id")
  async getDraft(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.frontOfficeService.getDraft(this.getCompanyId(user), id);
  }

  @Post("drafts/:id/fix")
  async fixDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body()
    body: {
      channel?: "telegram" | "web_chat" | "internal";
      messageText?: string;
      direction?: "inbound" | "outbound";
      threadExternalId?: string;
      dialogExternalId?: string;
      senderExternalId?: string;
      recipientExternalId?: string;
      route?: string;
      targetOwnerRole?: string;
      taskId?: string;
      fieldId?: string;
      seasonId?: string;
      sourceMessageId?: string;
      chatId?: string;
      photoUrl?: string;
      voiceUrl?: string;
      coordinates?: any;
      telemetryJson?: any;
      traceId?: string;
    },
  ) {
    return this.frontOfficeService.fixDraft(
      this.getCompanyId(user),
      body.traceId ?? `fo-fix:${Date.now()}`,
      { id: this.getUserId(user), role: user.role },
      id,
      body,
    );
  }

  @Post("drafts/:id/link")
  async linkDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body()
    body: { taskId?: string; fieldId?: string; seasonId?: string; farmRef?: string },
  ) {
    return this.frontOfficeService.linkDraft(
      this.getCompanyId(user),
      this.getUserId(user),
      id,
      body,
    );
  }

  @Post("drafts/:id/confirm")
  async confirmDraft(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.frontOfficeService.confirmDraft(
      this.getCompanyId(user),
      { id: this.getUserId(user), role: user.role },
      id,
    );
  }

  @Get("threads/:threadKey")
  async getThread(@CurrentUser() user: AuthenticatedUser, @Param("threadKey") threadKey: string) {
    return this.frontOfficeService.getThread(this.getCompanyId(user), threadKey);
  }

  @Post("threads/:threadKey/reply")
  async replyToThread(
    @CurrentUser() user: AuthenticatedUser,
    @Param("threadKey") threadKey: string,
    @Body() body: { messageText: string },
  ) {
    return this.frontOfficeService.replyToThread(
      this.getCompanyId(user),
      { id: this.getUserId(user), role: user.role },
      threadKey,
      body.messageText,
    );
  }

  @Post("threads/:threadKey/read")
  async markThreadRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param("threadKey") threadKey: string,
    @Body() body: { lastMessageId?: string },
  ) {
    return this.frontOfficeService.markThreadRead(
      this.getCompanyId(user),
      this.getUserId(user),
      threadKey,
      body.lastMessageId,
    );
  }

  @Get("assignments")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async listAssignments(@CurrentUser() user: AuthenticatedUser) {
    return this.frontOfficeService.listAssignments(this.getCompanyId(user));
  }

  @Post("assignments")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async createAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: { userId: string; farmAccountId: string; status?: string; priority?: number },
  ) {
    return this.frontOfficeService.createAssignment(this.getCompanyId(user), body);
  }

  @Delete("assignments/:id")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteAssignment(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.frontOfficeService.deleteAssignment(this.getCompanyId(user), id);
  }

  @Get("handoffs")
  async listHandoffs(@CurrentUser() user: AuthenticatedUser) {
    return this.frontOfficeService.listHandoffs(this.getCompanyId(user));
  }

  @Get("handoffs/:id")
  async getHandoff(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.frontOfficeService.getHandoff(this.getCompanyId(user), id);
  }

  @Post("handoffs/:id/claim")
  async claimHandoff(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.frontOfficeService.claimHandoff(
      this.getCompanyId(user),
      id,
      this.getUserId(user),
    );
  }

  @Post("handoffs/:id/reject")
  async rejectHandoff(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: { reason: string },
  ) {
    return this.frontOfficeService.rejectHandoff(
      this.getCompanyId(user),
      id,
      this.getUserId(user),
      body.reason,
    );
  }

  @Post("handoffs/:id/resolve")
  async resolveHandoff(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: { ownerResultRef?: string; note?: string },
  ) {
    return this.frontOfficeService.resolveHandoff(
      this.getCompanyId(user),
      id,
      this.getUserId(user),
      body.ownerResultRef,
      body.note,
    );
  }

  @Post("handoffs/:id/manual-note")
  async addManualNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: { note: string },
  ) {
    return this.frontOfficeService.addManualNote(
      this.getCompanyId(user),
      id,
      this.getUserId(user),
      body.note,
    );
  }

  @Get("seasons/:id/history")
  async getSeasonHistory(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.orchestratorService.getStageHistory(id, this.getCompanyId(user));
  }
}
