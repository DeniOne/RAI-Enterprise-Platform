import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { User } from "@rai/prisma-client";
import { FrontOfficeService } from "./front-office.service";
import { AgroOrchestratorService } from "../agro-orchestrator/agro-orchestrator.service";

@Controller("front-office")
@UseGuards(JwtAuthGuard)
export class FrontOfficeController {
  constructor(
    private readonly frontOfficeService: FrontOfficeService,
    private readonly orchestratorService: AgroOrchestratorService,
  ) {}

  @Get("overview")
  async getOverview(@CurrentUser() user: User) {
    return this.frontOfficeService.getOverview(user.companyId!, user.id);
  }

  @Get("deviations")
  async listDeviations(@CurrentUser() user: User) {
    return this.frontOfficeService.listDeviations(user.companyId!);
  }

  @Post("deviations")
  async createDeviation(
    @CurrentUser() user: User,
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
    return this.frontOfficeService.createDeviation(user.companyId!, user.id, body);
  }

  @Get("consultations")
  async listConsultations(@CurrentUser() user: User) {
    return this.frontOfficeService.listConsultations(user.companyId!);
  }

  @Post("consultations")
  async createConsultation(
    @CurrentUser() user: User,
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
      user.companyId!,
      user.id,
      body,
    );
  }

  @Get("context-updates")
  async listContextUpdates(@CurrentUser() user: User) {
    return this.frontOfficeService.listContextUpdates(user.companyId!);
  }

  @Post("context-updates")
  async createContextUpdate(
    @CurrentUser() user: User,
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
      user.companyId!,
      user.id,
      body,
    );
  }

  @Post("intake/classify")
  async classify(
    @CurrentUser() user: User,
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
      user.companyId!,
      body.traceId ?? `fo-classify:${Date.now()}`,
      {
        ...body,
        userId: user.id,
        userRole: user.role,
      },
    );
  }

  @Post("intake/message")
  async intake(
    @CurrentUser() user: User,
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
      user.companyId!,
      body.traceId ?? `fo-intake:${Date.now()}`,
      { id: user.id, role: user.role },
      body,
    );
  }

  @Get("queues")
  async getQueues(@CurrentUser() user: User) {
    return this.frontOfficeService.getQueues(user.companyId!);
  }

  @Get("drafts/:id")
  async getDraft(@CurrentUser() user: User, @Param("id") id: string) {
    return this.frontOfficeService.getDraft(user.companyId!, id);
  }

  @Post("drafts/:id/fix")
  async fixDraft(
    @CurrentUser() user: User,
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
      user.companyId!,
      body.traceId ?? `fo-fix:${Date.now()}`,
      { id: user.id, role: user.role },
      id,
      body,
    );
  }

  @Post("drafts/:id/link")
  async linkDraft(
    @CurrentUser() user: User,
    @Param("id") id: string,
    @Body()
    body: { taskId?: string; fieldId?: string; seasonId?: string; farmRef?: string },
  ) {
    return this.frontOfficeService.linkDraft(user.companyId!, user.id, id, body);
  }

  @Post("drafts/:id/confirm")
  async confirmDraft(@CurrentUser() user: User, @Param("id") id: string) {
    return this.frontOfficeService.confirmDraft(
      user.companyId!,
      { id: user.id, role: user.role },
      id,
    );
  }

  @Get("threads/:threadKey")
  async getThread(@CurrentUser() user: User, @Param("threadKey") threadKey: string) {
    return this.frontOfficeService.getThread(user.companyId!, threadKey);
  }

  @Get("seasons/:id/history")
  async getSeasonHistory(@Param("id") id: string, @CurrentUser() user: User) {
    return this.orchestratorService.getStageHistory(id, user.companyId!);
  }
}
