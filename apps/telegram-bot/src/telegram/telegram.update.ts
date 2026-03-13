import { Update, Start, Hears, Ctx, Action, On } from "nestjs-telegraf";
import { Context, Markup } from "telegraf";
import { Logger } from "@nestjs/common";
import { ProgressService } from "./progress.service";
import {
  ApiClientService,
  FrontOfficeDraftResponseDto,
} from "../shared/api-client/api-client.service";
import {
  SessionService,
  UserSession,
} from "../shared/session/session.service";

const FRONT_OFFICE_CALLBACK_PREFIX = "fo";
const FRONT_OFFICE_CALLBACK_MAX_LENGTH = 64;

type FrontOfficeActionCode = "c" | "f" | "l";
type TelegramTunnel = "front_office_rep" | "back_office_operator";
type FrontOfficeTextCommand =
  | { type: "fix"; draftId: string; messageText: string }
  | { type: "link"; draftId: string; rawRefs: string };

interface FrontOfficeLinkPatch {
  farmRef?: string;
  fieldId?: string;
  seasonId?: string;
  taskId?: string;
}

@Update()
export class TelegramUpdate {
  private readonly logger = new Logger(TelegramUpdate.name);

  constructor(
    private readonly progressService: ProgressService,
    private readonly apiClient: ApiClientService,
    private readonly session: SessionService,
  ) { }

  private async getUser(ctx: Context) {
    if (!ctx.from) return null;
    const telegramId = ctx.from.id.toString();
    try {
      return await this.apiClient.getUser(telegramId);
    } catch (e) {
      console.error(`[TelegramUpdate] Failed to get user ${telegramId}:`, e.message);
      return null;
    }
  }

  private async getAccessToken(ctx: Context): Promise<string | null> {
    if (!ctx.from) return null;
    const session = await this.session.getSession(ctx.from.id);
    return session?.token || null;
  }

  private resolveTelegramTunnel(user: any): TelegramTunnel {
    if (user?.telegramTunnel === "back_office_operator") {
      return "back_office_operator";
    }

    if (["MANAGER", "ADMIN", "CEO", "CFO", "AGRONOMIST"].includes(user?.role)) {
      return "back_office_operator";
    }

    if (user?.accountId || user?.account?.id || user?.employeeProfile?.clientId) {
      return "front_office_rep";
    }

    return "front_office_rep";
  }

  private getMiniAppUrl(): string {
    return (
      process.env.TELEGRAM_MINIAPP_URL ||
      process.env.WEBAPP_URL ||
      process.env.FRONTEND_URL ||
      "http://localhost:3000/telegram/workspace"
    );
  }

  private isTelegramMiniAppUrl(url: string): boolean {
    return /^https:\/\//i.test(url);
  }

  private isHttpUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  private getBackOfficeLauncherKeyboard() {
    const miniAppUrl = this.getMiniAppUrl();
    if (this.isTelegramMiniAppUrl(miniAppUrl)) {
      return Markup.inlineKeyboard([
        [Markup.button.webApp("Открыть рабочее место", miniAppUrl)],
        [Markup.button.callback("Помощь", "backoffice_help")],
      ]);
    }

    if (this.isHttpUrl(miniAppUrl)) {
      return Markup.inlineKeyboard([
        [Markup.button.callback("Открыть рабочее место", "backoffice_open_workspace")],
        [Markup.button.callback("Помощь", "backoffice_help")],
      ]);
    }

    return Markup.inlineKeyboard([
      [Markup.button.callback("Помощь", "backoffice_help")],
    ]);
  }

  private async replyWithWorkspaceLauncher(
    ctx: Context,
    message = "Работа с хозяйствами и A-RAI вынесена в Telegram Mini App.",
  ) {
    const miniAppUrl = this.getMiniAppUrl();
    const launcherMode = this.isTelegramMiniAppUrl(miniAppUrl)
      ? "web_app"
      : this.isHttpUrl(miniAppUrl)
        ? "url_button"
        : "help_only";
    this.logger.log(
      `backoffice_launcher mode=${launcherMode} miniAppUrl=${miniAppUrl}`,
    );
    await ctx.reply(
      this.isTelegramMiniAppUrl(miniAppUrl)
        ? `🧭 <b>Рабочее место бэкофиса</b>\n\n${message}\n\nВ общем чате бот больше не принимает свободный текст от менеджера.`
        : `🧭 <b>Рабочее место бэкофиса</b>\n\n${message}\n\nВ общем чате бот больше не принимает свободный текст от менеджера.\n\nДля локального теста откройте вручную: ${miniAppUrl}`,
      {
        parse_mode: "HTML",
        ...this.getBackOfficeLauncherKeyboard(),
      },
    );
  }

  private buildFrontOfficeCallbackData(
    action: FrontOfficeActionCode,
    draftId: string,
  ): string {
    const callback = `${FRONT_OFFICE_CALLBACK_PREFIX}:${action}:${draftId}`;
    if (callback.length > FRONT_OFFICE_CALLBACK_MAX_LENGTH) {
      throw new Error("Front-office callback data exceeds Telegram limit");
    }
    return callback;
  }

  private getFrontOfficeKeyboard(draftId: string) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback("✅", this.buildFrontOfficeCallbackData("c", draftId)),
        Markup.button.callback("✏️", this.buildFrontOfficeCallbackData("f", draftId)),
        Markup.button.callback("🔗", this.buildFrontOfficeCallbackData("l", draftId)),
      ],
    ]);
  }

  private formatMissingMust(mustClarifications?: string[]): string {
    if (!mustClarifications || mustClarifications.length === 0) {
      return "MUST закрыты.";
    }

    return `Нужно уточнить: ${mustClarifications.join(", ")}`;
  }

  private formatFrontOfficeReply(result: FrontOfficeDraftResponseDto): string {
    const draftId = result.draftId ?? result.draft?.id ?? "unknown";
    const status = result.draft?.status ?? result.status;
    const message = result.status === "COMMITTED" ? "Сигнал подтверждён" : "Сигнал зафиксирован";
    const must = this.formatMissingMust(
      result.mustClarifications ?? result.draft?.mustClarifications,
    );
    const intent = result.suggestedIntent
      ? `\nintent: <b>${result.suggestedIntent}</b>`
      : "";
    const committedId = result.commitResult?.id
      ? `\ncommit: <code>${result.commitResult.id}</code>`
      : "";
    const handoff =
      result.handoffId || result.handoffStatus || result.targetOwnerRole
        ? `\nhandoff: <b>${result.handoffStatus ?? "PENDING"}</b>${result.targetOwnerRole ? ` -> ${result.targetOwnerRole}` : ""}${result.handoffId ? ` (#<code>${result.handoffId}</code>)` : ""}`
        : "";

    return `${message}\ndraft: <code>${draftId}</code>\nstatus: <b>${status}</b>${intent}${handoff}\n${must}${committedId}`;
  }

  private async replyWithFrontOfficeDraft(
    ctx: Context,
    result: FrontOfficeDraftResponseDto,
  ): Promise<void> {
    const shouldSuppressReply =
      result.status === "COMMITTED" &&
      result.replyStatus === "SENT" &&
      (result.resolutionMode === "AUTO_REPLY" ||
        result.resolutionMode === "REQUEST_CLARIFICATION" ||
        result.resolutionMode === "HUMAN_HANDOFF");

    if (shouldSuppressReply) {
      return;
    }

    await ctx.reply(this.formatFrontOfficeReply(result), {
      parse_mode: "HTML",
      ...(result.allowedActions?.length
        ? this.getFrontOfficeKeyboard(result.draftId)
        : {}),
    });
  }

  private parseLinkPatch(message: string): FrontOfficeLinkPatch | null {
    const patch: FrontOfficeLinkPatch = {};
    const patterns: Array<[keyof FrontOfficeLinkPatch, RegExp]> = [
      ["farmRef", /(?:^|\s)(?:farm|farmRef)\s*[:=]\s*([^\s,;]+)/i],
      ["fieldId", /(?:^|\s)(?:field|fieldId)\s*[:=]\s*([^\s,;]+)/i],
      ["seasonId", /(?:^|\s)(?:season|seasonId)\s*[:=]\s*([^\s,;]+)/i],
      ["taskId", /(?:^|\s)(?:task|taskId)\s*[:=]\s*([^\s,;]+)/i],
    ];

    for (const [key, pattern] of patterns) {
      const match = message.match(pattern);
      if (match?.[1]) {
        patch[key] = match[1];
      }
    }

    return Object.keys(patch).length > 0 ? patch : null;
  }

  private parseFrontOfficeCommand(message: string): FrontOfficeTextCommand | null {
    const fixMatch = message.match(
      /^\/fofix(?:@\w+)?\s+([A-Za-z0-9-]+)\s+([\s\S]+)$/i,
    );
    if (fixMatch) {
      return {
        type: "fix",
        draftId: fixMatch[1],
        messageText: fixMatch[2].trim(),
      };
    }

    const linkMatch = message.match(
      /^\/folink(?:@\w+)?\s+([A-Za-z0-9-]+)\s+([\s\S]+)$/i,
    );
    if (linkMatch) {
      return {
        type: "link",
        draftId: linkMatch[1],
        rawRefs: linkMatch[2].trim(),
      };
    }

    return null;
  }

  private async createFrontOfficeDraftFromText(
    ctx: Context,
    accessToken: string,
    message: string,
  ): Promise<void> {
    const session = await this.session.getSession(ctx.from!.id);
    const result = await this.apiClient.createFrontOfficeDraft(
      {
        channel: "telegram",
        messageText: message,
        direction: "inbound",
        taskId: session?.activeTaskId,
        coordinates: session?.currentCoordinates,
        sourceMessageId: (ctx.message as any)?.message_id?.toString?.(),
        chatId: (ctx.chat as any)?.id?.toString?.(),
        threadExternalId: (ctx.chat as any)?.id?.toString?.(),
        senderExternalId: ctx.from?.id?.toString?.(),
      },
      accessToken,
    );

    await this.replyWithFrontOfficeDraft(ctx, result);
  }

  private async createFrontOfficeDraftFromPhoto(
    ctx: any,
    accessToken: string,
    session: UserSession,
  ): Promise<void> {
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);
    const caption = typeof ctx.message.caption === "string"
      ? ctx.message.caption
      : undefined;

    const result = await this.apiClient.createFrontOfficeDraft(
      {
        channel: "telegram",
        messageText: caption ?? "[photo]",
        direction: "inbound",
        taskId: session.activeTaskId,
        coordinates: session.currentCoordinates,
        sourceMessageId: ctx.message.message_id?.toString?.(),
        chatId: ctx.chat?.id?.toString?.(),
        threadExternalId: ctx.chat?.id?.toString?.(),
        senderExternalId: ctx.from?.id?.toString?.(),
        photoUrl: fileLink.toString(),
      },
      accessToken,
    );

    await this.replyWithFrontOfficeDraft(ctx, result);
  }

  private async createFrontOfficeDraftFromVoice(
    ctx: any,
    accessToken: string,
    session: UserSession,
  ): Promise<void> {
    const voice = ctx.message.voice;
    const fileLink = await ctx.telegram.getFileLink(voice.file_id);

    const result = await this.apiClient.createFrontOfficeDraft(
      {
        channel: "telegram",
        messageText: "[voice]",
        direction: "inbound",
        taskId: session.activeTaskId,
        coordinates: session.currentCoordinates,
        sourceMessageId: ctx.message.message_id?.toString?.(),
        chatId: ctx.chat?.id?.toString?.(),
        threadExternalId: ctx.chat?.id?.toString?.(),
        senderExternalId: ctx.from?.id?.toString?.(),
        voiceUrl: fileLink.toString(),
      },
      accessToken,
    );

    await this.replyWithFrontOfficeDraft(ctx, result);
  }


  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    const user = await this.getUser(ctx);
    if (!user) {
      const username = ctx.from?.username
        ? `@${ctx.from.username}`
        : "Mystery Guest";
      await ctx.reply(
        `⛔ <b>Доступ не настроен</b>\n\nПривет, ${username}! Telegram ID <code>${ctx.from?.id}</code> не привязан к пользователю RAI_EP.\n\nВнешний front-office доступ работает только по приглашению. Попросите менеджера или администратора отправить вам инвайт и активируйте его по ссылке.`,
        { parse_mode: "HTML" },
      );
      return;
    }

    if (this.resolveTelegramTunnel(user) === "back_office_operator") {
      await this.replyWithWorkspaceLauncher(
        ctx,
        "Выберите хозяйство в Mini App или откройте вкладку A-RAI для отдельного диалога.",
      );
      return;
    }

    const keyboard = Markup.keyboard([
      ["📋 Мои задачи", "📊 Прогресс"],
      ["🧠 Рекомендации", "📊 Опросы"],
    ]).resize();

    await ctx.reply(
      `👋 Добро пожаловать! Вы вошли как ${user.email ?? "Полевой работник"}.\nИспользуйте меню для навигации.`,
      keyboard,
    );
  }

  @Action("backoffice_help")
  async onBackOfficeHelp(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery();
    await this.replyWithWorkspaceLauncher(
      ctx,
      "Сценарий v1 такой: хозяйство пишет сюда, менеджер открывает Mini App, выбирает назначенное хозяйство и отвечает оттуда.",
    );
  }

  @Action("backoffice_open_workspace")
  async onBackOfficeOpenWorkspace(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery();
    const miniAppUrl = this.getMiniAppUrl();
    await ctx.reply(
      `Откройте рабочее место: ${miniAppUrl}`,
    );
  }

  @Action("request_access")
  async onRequestAccess(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery("Доступ выдается только по приглашению");
    await ctx.editMessageText(
      "⚠️ <b>Self-service заявка отключена</b>\n\nС 12 марта 2026 доступ в front-office выдается только через приглашение из CRM/контактной карточки. Обратитесь к менеджеру или администратору.",
      { parse_mode: "HTML" },
    );
  }

  @Action(/approve_user:(.+)/)
  async onApproveUser(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery("Ручной approve через бота отключен");
    await ctx.editMessageText(
      "⚠️ <b>Ручная выдача доступа через Telegram отключена</b>\n\nИспользуйте canonical invite flow из CRM/party contacts. Бот больше не создает пользователей напрямую.",
      { parse_mode: "HTML" },
    );
  }

  @Action(/decline_user:(.+)/)
  async onDeclineUser(@Ctx() ctx: Context): Promise<void> {
    await ctx.answerCbQuery("Legacy-flow отключен");
    await ctx.editMessageText(
      "⚠️ <b>Legacy-flow отключен</b>\n\nЕсли доступ не нужен, просто не отправляйте инвайт. Отказы через Telegram approve queue больше не используются.",
      { parse_mode: "HTML" },
    );
  }

  @Hears("📊 Прогресс")
  async onProgress(@Ctx() ctx: Context): Promise<void> {
    const stats = this.progressService.getProgressStats();
    const report = this.progressService.formatReport(stats);
    await ctx.reply(report, { parse_mode: "HTML" });
  }

  @Hears("🧠 Рекомендации")
  @Hears("/advisory")
  async onAdvisoryRecommendations(@Ctx() ctx: Context): Promise<void> {
    const accessToken = await this.getAccessToken(ctx);
    if (!accessToken) {
      await ctx.reply("🔑 Требуется авторизация через веб.");
      return;
    }

    try {
      const pilotStatus = await this.apiClient.getAdvisoryPilotStatus(accessToken);
      if (!pilotStatus.enabled) {
        await ctx.reply("⛔ Advisory-пилот для вашего аккаунта пока не включен.");
        return;
      }

      const rolloutStatus = await this.apiClient.getAdvisoryRolloutStatus(accessToken);
      if (rolloutStatus.stage === "S0") {
        await ctx.reply("Advisory rollout is currently at stage S0. Recommendations are temporarily blocked.");
        return;
      }

      const recommendations = await this.apiClient.getMyAdvisoryRecommendations(accessToken);
      if (recommendations.length === 0) {
        await ctx.reply("✅ На данный момент нет активных рекомендаций.");
        return;
      }

      for (const item of recommendations) {
        const factors = item.explainability.factors
          .slice(0, 3)
          .map((f) => `${f.name}: ${f.value}`)
          .join(" | ");

        await ctx.reply(
          `🧠 <b>Рекомендация ${item.recommendation}</b>\n` +
          `traceId: <code>${item.traceId}</code>\n` +
          `confidence: ${(item.confidence * 100).toFixed(1)}%\n` +
          `why: ${item.explainability.why}\n` +
          `factors: ${factors || "-"}`,
          {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback("✅ Принять", `accept_advisory:${item.traceId}`),
                Markup.button.callback("❌ Отклонить", `reject_advisory:${item.traceId}`),
              ],
            ]),
          },
        );
      }
    } catch (e) {
      this.logger.error(`[ADVISORY] Failed to fetch recommendations: ${e.message}`);
      await ctx.reply("вќЊ РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЂРµРєРѕРјРµРЅРґР°С†РёРё.");
    }
  }

  @Action(/accept_advisory:(.+)/)
  async onAcceptAdvisory(@Ctx() ctx: Context): Promise<void> {
    if (!("match" in ctx && ctx.match) || !ctx.from) return;
    const traceId = ctx.match[1];
    const accessToken = await this.getAccessToken(ctx);

    if (!accessToken) {
      await ctx.answerCbQuery("рџ”‘ РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ");
      return;
    }

    try {
      await this.apiClient.acceptAdvisory(traceId, accessToken);
      const session = await this.session.getSession(ctx.from.id);
      if (session && session.pendingAdvisoryFeedbackTraceId === traceId) {
        await this.session.saveSession(ctx.from.id, {
          token: session.token,
          userId: session.userId,
          companyId: session.companyId,
          lastActive: session.lastActive,
          activeTaskId: session.activeTaskId,
          currentCoordinates: session.currentCoordinates,
          surveyState: session.surveyState,
          pendingAdvisoryFeedbackTraceId: undefined,
        });
      }

      await ctx.answerCbQuery("Рекомендация принята");
      await ctx.editMessageText(
        `${(ctx.callbackQuery as any).message.text}\n\n✅ <b>Статус: Принято</b>`,
        { parse_mode: "HTML" },
      );
    } catch (e) {
      this.logger.error(`[ADVISORY] Accept failed for ${traceId}: ${e.message}`);
      await ctx.answerCbQuery("❌ Ошибка подтверждения");
    }
  }

  @Action(/reject_advisory:(.+)/)
  async onRejectAdvisory(@Ctx() ctx: Context): Promise<void> {
    if (!("match" in ctx && ctx.match) || !ctx.from) return;
    const traceId = ctx.match[1];
    const accessToken = await this.getAccessToken(ctx);

    if (!accessToken) {
      await ctx.answerCbQuery("рџ”‘ РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ");
      return;
    }

    try {
      await this.apiClient.rejectAdvisory(traceId, accessToken);
      const session = await this.session.getSession(ctx.from.id);
      if (session) {
        await this.session.saveSession(ctx.from.id, {
          ...session,
          pendingAdvisoryFeedbackTraceId: traceId,
        });
      }

      await ctx.reply("✅ Причина отклонения сохранена.");
    } catch (e) {
      this.logger.error(`[ADVISORY] Reject failed for ${traceId}: ${e.message}`);
      await ctx.answerCbQuery("❌ Ошибка отклонения");
    }
  }

  @Action(/fo:([cfl]):([A-Za-z0-9-]+)/)
  async onFrontOfficeAction(@Ctx() ctx: Context): Promise<void> {
    if (!("match" in ctx && ctx.match) || !ctx.from) return;

    const action = ctx.match[1] as FrontOfficeActionCode;
    const draftId = ctx.match[2];
    const callbackData = (ctx.callbackQuery as any)?.data;
    if (
      typeof callbackData !== "string" ||
      callbackData.length > FRONT_OFFICE_CALLBACK_MAX_LENGTH
    ) {
      await ctx.answerCbQuery("Некорректная кнопка");
      return;
    }

    const accessToken = await this.getAccessToken(ctx);
    if (!accessToken) {
      await ctx.answerCbQuery("Нужна авторизация");
      return;
    }

    try {
      if (action === "c") {
        const result = await this.apiClient.confirmFrontOfficeDraft(
          draftId,
          accessToken,
        );
        await ctx.answerCbQuery("Confirm отправлен");
        await ctx.reply(this.formatFrontOfficeReply(result), {
          parse_mode: "HTML",
          ...(result.allowedActions?.length
            ? this.getFrontOfficeKeyboard(draftId)
            : {}),
        });
        return;
      }

      await ctx.answerCbQuery(
        action === "f" ? "Отправьте команду /fofix" : "Отправьте команду /folink",
      );
      await ctx.reply(
        action === "f"
          ? `Для правки отправьте:\n<code>/fofix ${draftId} новый текст сигнала</code>`
          : `Для привязки отправьте:\n<code>/folink ${draftId} field=... season=... task=...</code>`,
        { parse_mode: "HTML" },
      );
    } catch (e) {
      this.logger.error(`[FRONT_OFFICE] Action ${action} failed: ${e.message}`);
      await ctx.answerCbQuery("Ошибка front-office");
    }
  }

  /**
   * ================================
   * TASK MANAGEMENT HANDLERS
   * ================================
   */

  @Hears("📋 Мои задачи")
  @Hears("/mytasks")
  async onMyTasks(@Ctx() ctx: Context): Promise<void> {
    const user = await this.getUser(ctx);
    if (!user) {
      await ctx.reply("⛔ Доступ запрещен. Введите /start для регистрации.");
      return;
    }

    const accessToken = await this.getAccessToken(ctx);
    if (!accessToken) {
      await ctx.reply("🔑 Пожалуйста, выполните вход через веб-интерфейс или запросите временный токен.");
      return;
    }

    try {
      const tasks = await this.apiClient.getMyTasks(accessToken);

      if (tasks.length === 0) {
        await ctx.reply("✅ У вас нет активных задач.");
        return;
      }

      for (const task of tasks) {
        const fieldName = task.field?.name || "Неизвестное поле";
        const statusIcon = task.status === "IN_PROGRESS" ? "⏳" : "🆕";
        const statusText = task.status === "IN_PROGRESS" ? "В работе" : "Ожидает";

        const buttons: ReturnType<typeof Markup.button.callback>[] = [];
        if (task.status === "PENDING") {
          buttons.push(
            Markup.button.callback("▶ Начать", `start_task:${task.id}`),
          );
        } else if (task.status === "IN_PROGRESS") {
          buttons.push(
            Markup.button.callback("✅ Завершить", `complete_task:${task.id}`),
          );
        }

        await ctx.reply(
          `${statusIcon} <b>${task.name}</b>\n📍 Поле: ${fieldName}\n📊 Статус: ${statusText}\n📅 Дата: ${task.plannedDate ? new Date(task.plannedDate).toLocaleDateString("ru-RU") : "Не указана"}`,
          {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
              buttons,
              [Markup.button.callback("📜 Техкарта", `view_techmap:${task.seasonId}`)]
            ]),
          },
        );
      }
    } catch (e) {
      console.error("вќЊ Error fetching tasks:", e);
      await ctx.reply("вќЊ РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° РїСЂРё Р·Р°РіСЂСѓР·РєРµ Р·Р°РґР°С‡. РџРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕР·Р¶Рµ.");
    }
  }

  @Action(/start_task:(.+)/)
  async onStartTask(@Ctx() ctx: Context): Promise<void> {
    if (!("match" in ctx && ctx.match)) return;
    if (!ctx.from) return;
    const taskId = ctx.match[1];

    const user = await this.getUser(ctx);
    if (!user) {
      await ctx.answerCbQuery("в›” Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ");
      return;
    }

    try {
      const accessToken = await this.getAccessToken(ctx);
      if (!accessToken) throw new Error("Unauthorized");

      await this.apiClient.startTask(taskId, accessToken);

      // [LAW] Track active task for sensory context (dumb tracing)
      const session = await this.session.getSession(ctx.from.id);
      if (session) {
        await this.session.saveSession(ctx.from.id, {
          ...session,
          activeTaskId: taskId,
        });
      }

      await ctx.answerCbQuery("Задача начата! ▶");
      await ctx.editMessageText(
        (ctx.callbackQuery as any).message.text + "\n\n✅ <b>Задача начата!</b>\n<i>Отправляйте фото или геопозицию для отчета.</i>",
        { parse_mode: "HTML" },
      );
    } catch (e) {
      console.error("❌ Error starting task:", e);
      await ctx.answerCbQuery(`Ошибка: ${e.message}`);
    }
  }

  @Action(/complete_task:(.+)/)
  async onCompleteTask(@Ctx() ctx: Context): Promise<void> {
    if (!("match" in ctx && ctx.match)) return;
    const taskId = ctx.match[1];

    const user = await this.getUser(ctx);
    if (!user) {
      await ctx.answerCbQuery("в›” Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ");
      return;
    }

    try {
      const accessToken = await this.getAccessToken(ctx);
      if (!accessToken) throw new Error("Unauthorized");

      await this.apiClient.completeTask(taskId, accessToken);

      await ctx.answerCbQuery("Задача завершена! ✅");
      await ctx.editMessageText(
        (ctx.callbackQuery as any).message.text + "\n\n🎉 <b>Задача завершена!</b>",
        { parse_mode: "HTML" },
      );
    } catch (e) {
      console.error("❌ Error completing task:", e);
      await ctx.answerCbQuery(`Ошибка: ${e.message}`);
    }
  }

  /**
   * ================================
   * TELEGRAM 2FA LOGIN HANDLERS
   * ================================
   */

  @Action(/confirm_login:(.+)/)
  async onConfirmLogin(@Ctx() ctx: Context) {
    const match = (ctx as any).match;
    const sessionId = match[1];

    try {
      const result = await this.apiClient.confirmLogin(sessionId);

      if (ctx.from) {
        await this.session.saveSession(ctx.from.id, {
          token: result.accessToken,
          lastActive: Date.now(),
        });
      }

      await ctx.answerCbQuery();
      await ctx.editMessageText(
        "✅ <b>Вход подтверждён!</b>\n\nВы успешно авторизовались в веб-интерфейсе.",
        { parse_mode: "HTML" },
      );
    } catch (error) {
      console.error("❌ Error confirming login:", error);
      await ctx.answerCbQuery("Ошибка подтверждения");
    }
  }

  @Action(/deny_login:(.+)/)
  async onDenyLogin(@Ctx() ctx: Context) {
    const match = (ctx as any).match;
    const sessionId = match[1];

    try {
      await this.apiClient.denyLogin(sessionId);
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        "❌ <b>Вход отклонён</b>\n\nПопытка входа в веб-интерфейс была отклонена.",
        { parse_mode: "HTML" },
      );
    } catch (error) {
      console.error("❌ Error denying login:", error);
      await ctx.answerCbQuery("Ошибка отклонения");
    }
  }

  @Action(/view_techmap:(.+)/)
  async onViewTechMap(@Ctx() ctx: Context) {
    if (!("match" in ctx && ctx.match)) return;
    const seasonId = ctx.match[1];

    const accessToken = await this.getAccessToken(ctx);
    if (!accessToken) {
      await ctx.answerCbQuery("рџ”‘ РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ");
      return;
    }

    try {
      const techMap = await this.apiClient.getTechMapBySeason(seasonId, accessToken);

      // Find current stage (dummy logic: first unfinished)
      let report = `рџ“њ <b>РўРµС…РЅРѕР»РѕРіРёС‡РµСЃРєР°СЏ РєР°СЂС‚Р°</b>\n`;
      report += `РЎРµР·РѕРЅ ID: <code>${seasonId.slice(-6)}</code>\n\n`;

      for (const stage of techMap.stages) {
        report += `<b>[ ${stage.name} ]</b>\n`;
        for (const op of stage.operations) {
          report += `вЂў ${op.name}\n`;
          if (op.resources && op.resources.length > 0) {
            const resList = op.resources.map((r: any) => `${r.name} (${r.amount}${r.unit})`).join(', ');
            report += `  в”” рџ“¦ ${resList}\n`;
          }
        }
        report += `\n`;
      }

      await ctx.reply(report, { parse_mode: "HTML" });
      await ctx.answerCbQuery();
    } catch (e) {
      console.error("вќЊ Error fetching tech map for bot:", e);
      await ctx.answerCbQuery("вќЊ РћС€РёР±РєР° РїСЂРё Р·Р°РіСЂСѓР·РєРµ С‚РµС…РєР°СЂС‚С‹");
    }
  }

  /**
   * ================================
   * HR PULSE SURVEY HANDLERS
   * ================================
   */

  @Hears("📊 Опросы")
  @Hears("/pulse")
  async onPulseList(@Ctx() ctx: Context): Promise<void> {
    const accessToken = await this.getAccessToken(ctx);
    if (!accessToken) {
      await ctx.reply("🔑 Требуется авторизация через веб.");
      return;
    }

    try {
      const surveys = await this.apiClient.getPulseSurveys(accessToken);

      if (surveys.length === 0) {
        await ctx.reply("📥 На данный момент нет активных опросов.");
        return;
      }

      await ctx.reply("📋 <b>Доступные опросы:</b>", {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard(
          surveys.map((s: any) => [
            Markup.button.callback(s.title, `start_pulse:${s.id}`),
          ]),
        ),
      });
    } catch (e) {
      console.error("❌ Error fetching surveys:", e);
      await ctx.reply("❌ Ошибка при получении списка опросов.");
    }
  }

  @Action(/start_pulse:(.+)/)
  async onStartPulse(@Ctx() ctx: Context): Promise<void> {
    if (!("match" in ctx && ctx.match) || !ctx.from) return;
    const surveyId = ctx.match[1];
    const accessToken = await this.getAccessToken(ctx);

    try {
      const surveys = await this.apiClient.getPulseSurveys(accessToken!);
      const survey = surveys.find((s: any) => s.id === surveyId);

      if (!survey) {
        await ctx.answerCbQuery("❌ Опрос не найден");
        return;
      }

      const session = await this.session.getSession(ctx.from.id);
      await this.session.saveSession(ctx.from.id, {
        ...session!,
        surveyState: {
          surveyId,
          currentQuestionIndex: 0,
          answers: {},
        },
      });

      await this.renderQuestion(ctx, survey, 0);
      await ctx.answerCbQuery();
    } catch (e) {
      console.error(e);
      await ctx.answerCbQuery("РћС€РёР±РєР° Р·Р°РїСѓСЃРєР°");
    }
  }

  @Action(/answer_pulse:(.+)/)
  async onAnswerPulse(@Ctx() ctx: Context): Promise<void> {
    if (!("match" in ctx && ctx.match) || !ctx.from) return;
    const answerValue = ctx.match[1];
    const accessToken = await this.getAccessToken(ctx);
    const session = await this.session.getSession(ctx.from.id);

    if (!session?.surveyState) {
      await ctx.answerCbQuery("❌ Сессия опроса истекла");
      return;
    }

    const { surveyId, currentQuestionIndex, answers } = session.surveyState;
    const surveys = await this.apiClient.getPulseSurveys(accessToken!);
    const survey = surveys.find((s: any) => s.id === surveyId);

    if (!survey) return;

    const question = survey.questions[currentQuestionIndex];
    answers[question.id] = isNaN(Number(answerValue)) ? answerValue : Number(answerValue);

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < survey.questions.length) {
      await this.session.saveSession(ctx.from.id, {
        ...session,
        surveyState: { ...session.surveyState, currentQuestionIndex: nextIndex, answers },
      });
      await this.renderQuestion(ctx, survey, nextIndex);
    } else {
      // Finish survey
      await ctx.editMessageText("⏳ <b>Обработка ответов...</b>", { parse_mode: "HTML" });

      try {
        const user = await this.getUser(ctx);
        await this.apiClient.submitPulseResponse({
          pulseSurveyId: surveyId,
          respondentId: user.id, // Р’ РёРґРµР°Р»Рµ EmployeeProfile.id, РЅРѕ РґР»СЏ B2 Р±РµСЂРµРј User.id РµСЃР»Рё РѕРЅРё РјР°РїСЏС‚СЃСЏ
          employeeId: user.id,
          answers
        }, accessToken!);

        await ctx.editMessageText("🎉 <b>Спасибо за участие!</b>\nВаши ответы помогут нам стать лучше.", { parse_mode: "HTML" });

        // Clear survey state
        const updatedSession = await this.session.getSession(ctx.from.id);
        if (updatedSession) {
          delete updatedSession.surveyState;
          await this.session.saveSession(ctx.from.id, updatedSession);
        }
      } catch (e) {
        console.error("❌ Error submitting pulse:", e);
        await ctx.editMessageText("❌ Произошла ошибка при сохранении ответов.");
      }
    }
    await ctx.answerCbQuery();
  }


  @On("text")
  async onText(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.message || !("text" in ctx.message) || !ctx.from) return;
    const message = (ctx.message as any).text;

    const user = await this.getUser(ctx);
    if (!user) return;

    if (this.resolveTelegramTunnel(user) === "back_office_operator") {
      await this.replyWithWorkspaceLauncher(
        ctx,
        "Чтобы написать хозяйству, сначала выберите его в разделе «Хозяйства». Чтобы поговорить с A-RAI, откройте отдельную вкладку внутри Mini App.",
      );
      return;
    }

    const accessToken = await this.getAccessToken(ctx);
    if (!accessToken) return;

    try {
      const frontOfficeCommand = this.parseFrontOfficeCommand(message);
      const session = await this.session.getSession(ctx.from.id);
      const pendingFeedbackTraceId = session?.pendingAdvisoryFeedbackTraceId;
      if (pendingFeedbackTraceId) {
        await this.apiClient.recordAdvisoryFeedback(
          pendingFeedbackTraceId,
          { reason: message },
          accessToken,
        );

        await this.session.saveSession(ctx.from.id, {
          ...session!,
          pendingAdvisoryFeedbackTraceId: undefined,
        });

        await ctx.reply("✅ Причина отклонения сохранена.");
        return;
      }

      if (frontOfficeCommand?.type === "fix") {
        const result = await this.apiClient.fixFrontOfficeDraft(
          frontOfficeCommand.draftId,
          {
            messageText: frontOfficeCommand.messageText,
            taskId: session?.activeTaskId,
            coordinates: session?.currentCoordinates,
          },
          accessToken,
        );

        await this.replyWithFrontOfficeDraft(ctx, result);
        return;
      }

      if (frontOfficeCommand?.type === "link") {
        const patch = this.parseLinkPatch(frontOfficeCommand.rawRefs);
        if (!patch) {
          await ctx.reply(
            "Нужен формат: /folink <draftId> field=... season=... task=...",
          );
          return;
        }

        const result = await this.apiClient.linkFrontOfficeDraft(
          frontOfficeCommand.draftId,
          patch,
          accessToken,
        );

        await this.replyWithFrontOfficeDraft(ctx, result);
        return;
      }

      if (message.startsWith("/")) return;

      await this.createFrontOfficeDraftFromText(ctx, accessToken, message);
    } catch (e) {
      this.logger.error(`[FRONT_OFFICE] Text intake failed: ${e.message}`);
      await ctx.reply("❌ Ошибка при создании front-office draft.");
    }
  }

  /**
   * ================================
   * SENSORY PLANE (DUMB TRANSPORT)
   * ================================
   */

  @On("photo")
  async onPhoto(@Ctx() ctx: any) {
    if (!ctx.from || !ctx.message.photo) return;
    const user = await this.getUser(ctx);
    if (user && this.resolveTelegramTunnel(user) === "back_office_operator") {
      await this.replyWithWorkspaceLauncher(
        ctx,
        "Медиа от менеджера в общий бот не маршрутизируются. Используйте Mini App и конкретный thread хозяйства.",
      );
      return;
    }
    const session = await this.session.getSession(ctx.from.id);
    if (!session?.token) return;

    try {
      await this.createFrontOfficeDraftFromPhoto(ctx, session.token, session);
    } catch (e) {
      this.logger.error(`[FRONT_OFFICE] Photo intake failed: ${e.message}`);
      await ctx.reply("❌ Ошибка при создании photo draft.");
    }
  }

  @On("voice")
  async onVoice(@Ctx() ctx: any) {
    if (!ctx.from || !ctx.message.voice) return;
    const user = await this.getUser(ctx);
    if (user && this.resolveTelegramTunnel(user) === "back_office_operator") {
      await this.replyWithWorkspaceLauncher(
        ctx,
        "Голосовые сообщения менеджера не идут в общий ingress. Откройте Mini App и работайте из нужного контекста хозяйства.",
      );
      return;
    }
    const session = await this.session.getSession(ctx.from.id);
    if (!session?.token) return;

    try {
      await this.createFrontOfficeDraftFromVoice(ctx, session.token, session);
    } catch (e) {
      this.logger.error(`[FRONT_OFFICE] Voice intake failed: ${e.message}`);
      await ctx.reply("❌ Ошибка при создании voice draft.");
    }
  }

  @On("location")
  async onLocation(@Ctx() ctx: any) {
    if (!ctx.from || !ctx.message.location) return;
    const { latitude, longitude } = ctx.message.location;

    const session = await this.session.getSession(ctx.from.id);
    if (session) {
      await this.session.saveSession(ctx.from.id, {
        ...session,
        currentCoordinates: { lat: latitude, lng: longitude },
      });
      await ctx.reply(`📍 Координаты зафиксированы: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. Все последующие медиа будут иметь GPS-подпись.`);
    }
  }
  private async renderQuestion(ctx: Context, survey: any, index: number) {
    const question = survey.questions[index];
    const text = `<b>Опрос: ${survey.title}</b>\n\nВопрос ${index + 1}/${survey.questions.length}:\n${question.text}`;

    // Default options if not provided
    const options = question.options || [1, 2, 3, 4, 5];

    const keyboard = Markup.inlineKeyboard(
      options.map((opt: any) =>
        Markup.button.callback(opt.toString(), `answer_pulse:${opt}`)
      ),
      { columns: 5 }
    );

    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, { parse_mode: "HTML", ...keyboard });
    } else {
      await ctx.reply(text, { parse_mode: "HTML", ...keyboard });
    }
  }
}
