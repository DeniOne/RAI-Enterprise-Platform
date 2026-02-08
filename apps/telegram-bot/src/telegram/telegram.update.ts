import { Update, Start, Hears, Ctx, Action, On } from "nestjs-telegraf";
import { Context, Markup } from "telegraf";
import { Logger } from "@nestjs/common";
import { ProgressService } from "./progress.service";
import { ApiClientService } from "../shared/api-client/api-client.service";
import { SessionService } from "../shared/session/session.service";

const ADMIN_TG_ID = "441610858";

@Update()
export class TelegramUpdate {
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


  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    const user = await this.getUser(ctx);
    if (!user) {
      const username = ctx.from?.username
        ? `@${ctx.from.username}`
        : "Mystery Guest";
      await ctx.reply(
        `в›” <b>Р”РѕСЃС‚СѓРї РѕРіСЂР°РЅРёС‡РµРЅ</b>\n\nРџСЂРёРІРµС‚, ${username}! РўРІРѕР№ Telegram ID (${ctx.from?.id}) РЅРµ Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ РІ СЃРёСЃС‚РµРјРµ RAI_EP.\n\nР•СЃР»Рё С‚С‹ РєРѕР»Р»РµРіР° вЂ” РЅР°Р¶РјРё РєРЅРѕРїРєСѓ РЅРёР¶Рµ, С‡С‚РѕР±С‹ Р·Р°РїСЂРѕСЃРёС‚СЊ РґРѕСЃС‚СѓРї.`,
        {
          parse_mode: "HTML",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("рџ“ќ Р—Р°РїСЂРѕСЃРёС‚СЊ РґРѕСЃС‚СѓРї", "request_access")],
          ]),
        },
      );
      return;
    }

    const keyboard = Markup.keyboard([
      ["рџ“‹ РњРѕРё Р·Р°РґР°С‡Рё", "рџ“Љ РџСЂРѕРіСЂРµСЃСЃ"],
      ["рџ“Љ РћРїСЂРѕСЃС‹", "рџ§  Р РµРєРѕРјРµРЅРґР°С†РёРё"]
    ]).resize();

    await ctx.reply(
      `рџ‘‹ Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ! Р’С‹ РІРѕС€Р»Рё РєР°Рє ${user.email ?? "РџРѕР»РµРІРѕР№ СЂР°Р±РѕС‚РЅРёРє"}.\nРСЃРїРѕР»СЊР·СѓР№С‚Рµ РјРµРЅСЋ РґР»СЏ РЅР°РІРёРіР°С†РёРё.`,
      keyboard,
    );
  }

  @Action("request_access")
  async onRequestAccess(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.from) return;
    const tgId = ctx.from.id.toString();
    const username = ctx.from.username
      ? `@${ctx.from.username}`
      : "No Username";
    const name =
      `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim();

    await ctx.answerCbQuery("Р—Р°РїСЂРѕСЃ РѕС‚РїСЂР°РІР»РµРЅ Р°РґРјРёРЅСѓ рџљЂ");
    await ctx.editMessageText(
      "вњ… <b>Р—Р°РїСЂРѕСЃ РѕС‚РїСЂР°РІР»РµРЅ!</b>\nРЇ СЃРѕРѕР±С‰Сѓ С‚РµР±Рµ, РєРѕРіРґР° Р°РґРјРёРЅ РІС‹РґР°СЃС‚ РґРѕСЃС‚СѓРї.",
      { parse_mode: "HTML" },
    );

    // Notify Admin
    await ctx.telegram.sendMessage(
      ADMIN_TG_ID,
      `рџ”” <b>РќРћР’Р«Р™ Р—РђРџР РћРЎ Р”РћРЎРўРЈРџРђ</b>\n\nрџ‘¤ РРјСЏ: ${name}\nрџЊђ Р®Р·РµСЂ: ${username}\nрџ†” TG ID: <code>${tgId}</code>`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("вњ… РћРґРѕР±СЂРёС‚СЊ", `approve_user:${tgId}`),
            Markup.button.callback("вќЊ РћС‚РєР»РѕРЅРёС‚СЊ", `decline_user:${tgId}`),
          ],
        ]),
      },
    );
  }

  @Action(/approve_user:(.+)/)
  async onApproveUser(@Ctx() ctx: Context): Promise<void> {
    if (!("match" in ctx && ctx.match)) return;
    const tgId = ctx.match[1];

    // 1. Get default company via API
    try {
      const company = await this.apiClient.getFirstCompany();
      if (!company) {
        await ctx.reply("вќЊ РћС€РёР±РєР°: РљРѕРјРїР°РЅРёСЏ РЅРµ РЅР°Р№РґРµРЅР° РЅР° Р±СЌРєРµРЅРґРµ.");
        return;
      }

      const email = `tg_${tgId}@rai.local`;

      // 2. Upsert User via API
      await this.apiClient.upsertUser({
        telegramId: tgId,
        email,
        role: "USER",
        accessLevel: "ACTIVE",
        companyId: company.id,
      });


      await ctx.answerCbQuery("РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ РѕРґРѕР±СЂРµРЅ! вњ…");
      await ctx.editMessageText(`вњ… Р®Р·РµСЂ СЃ ID <code>${tgId}</code> С‚РµРїРµСЂСЊ РІ СЃРёСЃС‚РµРјРµ!`, {
        parse_mode: "HTML",
      });

      // 4. Notify User
      await ctx.telegram.sendMessage(
        tgId,
        "рџЋ‰ <b>РўРІРѕР№ РґРѕСЃС‚СѓРї РѕРґРѕР±СЂРµРЅ!</b>\nР’РІРµРґРё /start, С‡С‚РѕР±С‹ РѕС‚РєСЂС‹С‚СЊ РјРµРЅСЋ.",
        { parse_mode: "HTML" },
      );
    } catch (e) {
      console.error(e);
      await ctx.reply(`вќЊ РћС€РёР±РєР° Р°РїСЂСѓРІР°: ${e.message}`);
    }
  }

  @Action(/decline_user:(.+)/)
  async onDeclineUser(@Ctx() ctx: Context): Promise<void> {
    if (!("match" in ctx && ctx.match)) return;
    const tgId = ctx.match[1];

    await ctx.answerCbQuery("Р—Р°РїСЂРѕСЃ РѕС‚РєР»РѕРЅРµРЅ вќЊ");
    await ctx.editMessageText(`вќЊ Р—Р°РїСЂРѕСЃ РѕС‚ <code>${tgId}</code> РѕС‚РєР»РѕРЅРµРЅ.`, {
      parse_mode: "HTML",
    });

    // Notify User
    await ctx.telegram.sendMessage(
      tgId,
      "рџ” РР·РІРёРЅРё, С‚РІРѕР№ Р·Р°РїСЂРѕСЃ РЅР° РґРѕСЃС‚СѓРї Р±С‹Р» РѕС‚РєР»РѕРЅРµРЅ Р°РґРјРёРЅРѕРј.",
    );
  }

  @Hears("рџ“Љ РџСЂРѕРіСЂРµСЃСЃ")
  async onProgress(@Ctx() ctx: Context): Promise<void> {
    const stats = this.progressService.getProgressStats();
    const report = this.progressService.formatReport(stats);
    await ctx.reply(report, { parse_mode: "HTML" });
  }

  @Hears("рџ§  Р РµРєРѕРјРµРЅРґР°С†РёРё")
  @Hears("/advisory")
  async onAdvisoryRecommendations(@Ctx() ctx: Context): Promise<void> {
    const accessToken = await this.getAccessToken(ctx);
    if (!accessToken) {
      await ctx.reply("рџ”‘ РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ С‡РµСЂРµР· РІРµР±.");
      return;
    }

    try {
      const pilotStatus = await this.apiClient.getAdvisoryPilotStatus(accessToken);
      if (!pilotStatus.enabled) {
        await ctx.reply("в›” Advisory-РїРёР»РѕС‚ РґР»СЏ РІР°С€РµРіРѕ Р°РєРєР°СѓРЅС‚Р° РїРѕРєР° РЅРµ РІРєР»СЋС‡РµРЅ.");
        return;
      }

      const rolloutStatus = await this.apiClient.getAdvisoryRolloutStatus(accessToken);
      if (rolloutStatus.stage === "S0") {
        await ctx.reply("Advisory rollout is currently at stage S0. Recommendations are temporarily blocked.");
        return;
      }

      const recommendations = await this.apiClient.getMyAdvisoryRecommendations(accessToken);
      if (recommendations.length === 0) {
        await ctx.reply("вњ… РќР° РґР°РЅРЅС‹Р№ РјРѕРјРµРЅС‚ РЅРµС‚ Р°РєС‚РёРІРЅС‹С… СЂРµРєРѕРјРµРЅРґР°С†РёР№.");
        return;
      }

      for (const item of recommendations) {
        const factors = item.explainability.factors
          .slice(0, 3)
          .map((f) => `${f.name}: ${f.value}`)
          .join(" | ");

        await ctx.reply(
          `рџ§  <b>Р РµРєРѕРјРµРЅРґР°С†РёСЏ ${item.recommendation}</b>\n` +
          `traceId: <code>${item.traceId}</code>\n` +
          `confidence: ${(item.confidence * 100).toFixed(1)}%\n` +
          `why: ${item.explainability.why}\n` +
          `factors: ${factors || "-"}`,
          {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
              [
                Markup.button.callback("вњ… РџСЂРёРЅСЏС‚СЊ", `accept_advisory:${item.traceId}`),
                Markup.button.callback("вќЊ РћС‚РєР»РѕРЅРёС‚СЊ", `reject_advisory:${item.traceId}`),
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

      await ctx.answerCbQuery("Р РµРєРѕРјРµРЅРґР°С†РёСЏ РїСЂРёРЅСЏС‚Р°");
      await ctx.editMessageText(
        `${(ctx.callbackQuery as any).message.text}\n\nвњ… <b>РЎС‚Р°С‚СѓСЃ: РџСЂРёРЅСЏС‚Рѕ</b>`,
        { parse_mode: "HTML" },
      );
    } catch (e) {
      this.logger.error(`[ADVISORY] Accept failed for ${traceId}: ${e.message}`);
      await ctx.answerCbQuery("вќЊ РћС€РёР±РєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ");
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

      await ctx.answerCbQuery("Р РµРєРѕРјРµРЅРґР°С†РёСЏ РѕС‚РєР»РѕРЅРµРЅР°");
      await ctx.editMessageText(
        `${(ctx.callbackQuery as any).message.text}\n\nвќЊ <b>РЎС‚Р°С‚СѓСЃ: РћС‚РєР»РѕРЅРµРЅРѕ</b>\n` +
        `РћС‚РїСЂР°РІСЊС‚Рµ СЃР»РµРґСѓСЋС‰РёРј СЃРѕРѕР±С‰РµРЅРёРµРј РїСЂРёС‡РёРЅСѓ РѕС‚РєР»РѕРЅРµРЅРёСЏ.`,
        { parse_mode: "HTML" },
      );
    } catch (e) {
      this.logger.error(`[ADVISORY] Reject failed for ${traceId}: ${e.message}`);
      await ctx.answerCbQuery("вќЊ РћС€РёР±РєР° РѕС‚РєР»РѕРЅРµРЅРёСЏ");
    }
  }

  /**
   * ================================
   * TASK MANAGEMENT HANDLERS
   * ================================
   */

  @Hears("рџ“‹ РњРѕРё Р·Р°РґР°С‡Рё")
  @Hears("/mytasks")
  async onMyTasks(@Ctx() ctx: Context): Promise<void> {
    const user = await this.getUser(ctx);
    if (!user) {
      await ctx.reply("в›” Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ. Р’РІРµРґРёС‚Рµ /start РґР»СЏ СЂРµРіРёСЃС‚СЂР°С†РёРё.");
      return;
    }

    const accessToken = await this.getAccessToken(ctx);
    if (!accessToken) {
      await ctx.reply("рџ”‘ РџРѕР¶Р°Р»СѓР№СЃС‚Р°, РІС‹РїРѕР»РЅРёС‚Рµ РІС…РѕРґ С‡РµСЂРµР· РІРµР±-РёРЅС‚РµСЂС„РµР№СЃ РёР»Рё Р·Р°РїСЂРѕСЃРёС‚Рµ РІСЂРµРјРµРЅРЅС‹Р№ С‚РѕРєРµРЅ.");
      return;
    }

    try {
      const tasks = await this.apiClient.getMyTasks(accessToken);

      if (tasks.length === 0) {
        await ctx.reply("вњ… РЈ РІР°СЃ РЅРµС‚ Р°РєС‚РёРІРЅС‹С… Р·Р°РґР°С‡.");
        return;
      }

      for (const task of tasks) {
        const fieldName = task.field?.name || "РќРµРёР·РІРµСЃС‚РЅРѕРµ РїРѕР»Рµ";
        const statusIcon = task.status === "IN_PROGRESS" ? "вЏі" : "рџ†•";
        const statusText = task.status === "IN_PROGRESS" ? "Р’ СЂР°Р±РѕС‚Рµ" : "РћР¶РёРґР°РµС‚";

        const buttons: ReturnType<typeof Markup.button.callback>[] = [];
        if (task.status === "PENDING") {
          buttons.push(
            Markup.button.callback("в–¶ РќР°С‡Р°С‚СЊ", `start_task:${task.id}`),
          );
        } else if (task.status === "IN_PROGRESS") {
          buttons.push(
            Markup.button.callback("вњ… Р—Р°РІРµСЂС€РёС‚СЊ", `complete_task:${task.id}`),
          );
        }

        await ctx.reply(
          `${statusIcon} <b>${task.name}</b>\nрџ“Ќ РџРѕР»Рµ: ${fieldName}\nрџ“Љ РЎС‚Р°С‚СѓСЃ: ${statusText}\nрџ“… Р”Р°С‚Р°: ${task.plannedDate ? new Date(task.plannedDate).toLocaleDateString("ru-RU") : "РќРµ СѓРєР°Р·Р°РЅР°"}`,
          {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
              buttons,
              [Markup.button.callback("рџ“њ РўРµС…РєР°СЂС‚Р°", `view_techmap:${task.seasonId}`)]
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

      await ctx.answerCbQuery("Р—Р°РґР°С‡Р° РЅР°С‡Р°С‚Р°! в–¶");
      await ctx.editMessageText(
        (ctx.callbackQuery as any).message.text + "\n\nвњ… <b>Р—Р°РґР°С‡Р° РЅР°С‡Р°С‚Р°!</b>\n<i>РћС‚РїСЂР°РІР»СЏР№С‚Рµ С„РѕС‚Рѕ РёР»Рё РіРµРѕРїРѕР·РёС†РёСЋ РґР»СЏ РѕС‚С‡РµС‚Р°.</i>",
        { parse_mode: "HTML" },
      );
    } catch (e) {
      console.error("вќЊ Error starting task:", e);
      await ctx.answerCbQuery(`РћС€РёР±РєР°: ${e.message}`);
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

      await ctx.answerCbQuery("Р—Р°РґР°С‡Р° Р·Р°РІРµСЂС€РµРЅР°! вњ…");
      await ctx.editMessageText(
        (ctx.callbackQuery as any).message.text + "\n\nрџЋ‰ <b>Р—Р°РґР°С‡Р° Р·Р°РІРµСЂС€РµРЅР°!</b>",
        { parse_mode: "HTML" },
      );
    } catch (e) {
      console.error("вќЊ Error completing task:", e);
      await ctx.answerCbQuery(`РћС€РёР±РєР°: ${e.message}`);
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
        "вњ… <b>Р’С…РѕРґ РїРѕРґС‚РІРµСЂР¶РґС‘РЅ!</b>\n\nР’С‹ СѓСЃРїРµС€РЅРѕ Р°РІС‚РѕСЂРёР·РѕРІР°Р»РёСЃСЊ РІ РІРµР±-РёРЅС‚РµСЂС„РµР№СЃРµ.",
        { parse_mode: "HTML" },
      );
    } catch (error) {
      console.error("вќЊ Error confirming login:", error);
      await ctx.answerCbQuery("РћС€РёР±РєР° РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ");
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
        "вќЊ <b>Р’С…РѕРґ РѕС‚РєР»РѕРЅС‘РЅ</b>\n\nРџРѕРїС‹С‚РєР° РІС…РѕРґР° РІ РІРµР±-РёРЅС‚РµСЂС„РµР№СЃ Р±С‹Р»Р° РѕС‚РєР»РѕРЅРµРЅР°.",
        { parse_mode: "HTML" },
      );
    } catch (error) {
      console.error("вќЊ Error denying login:", error);
      await ctx.answerCbQuery("РћС€РёР±РєР° РѕС‚РєР»РѕРЅРµРЅРёСЏ");
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

  @Hears("рџ“Љ РћРїСЂРѕСЃС‹")
  @Hears("/pulse")
  async onPulseList(@Ctx() ctx: Context): Promise<void> {
    const accessToken = await this.getAccessToken(ctx);
    if (!accessToken) {
      await ctx.reply("рџ”‘ РўСЂРµР±СѓРµС‚СЃСЏ Р°РІС‚РѕСЂРёР·Р°С†РёСЏ С‡РµСЂРµР· РІРµР±.");
      return;
    }

    try {
      const surveys = await this.apiClient.getPulseSurveys(accessToken);

      if (surveys.length === 0) {
        await ctx.reply("рџ“Ґ РќР° РґР°РЅРЅС‹Р№ РјРѕРјРµРЅС‚ РЅРµС‚ Р°РєС‚РёРІРЅС‹С… РѕРїСЂРѕСЃРѕРІ.");
        return;
      }

      await ctx.reply("рџ“‹ <b>Р”РѕСЃС‚СѓРїРЅС‹Рµ РѕРїСЂРѕСЃС‹:</b>", {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard(
          surveys.map((s: any) => [
            Markup.button.callback(s.title, `start_pulse:${s.id}`),
          ]),
        ),
      });
    } catch (e) {
      console.error("вќЊ Error fetching surveys:", e);
      await ctx.reply("вќЊ РћС€РёР±РєР° РїСЂРё РїРѕР»СѓС‡РµРЅРёРё СЃРїРёСЃРєР° РѕРїСЂРѕСЃРѕРІ.");
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
        await ctx.answerCbQuery("вќЊ РћРїСЂРѕСЃ РЅРµ РЅР°Р№РґРµРЅ");
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
      await ctx.answerCbQuery("вќЊ РЎРµСЃСЃРёСЏ РѕРїСЂРѕСЃР° РёСЃС‚РµРєР»Р°");
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
      await ctx.editMessageText("вЏі <b>РћР±СЂР°Р±РѕС‚РєР° РѕС‚РІРµС‚РѕРІ...</b>", { parse_mode: "HTML" });

      try {
        const user = await this.getUser(ctx);
        await this.apiClient.submitPulseResponse({
          pulseSurveyId: surveyId,
          respondentId: user.id, // Р’ РёРґРµР°Р»Рµ EmployeeProfile.id, РЅРѕ РґР»СЏ B2 Р±РµСЂРµРј User.id РµСЃР»Рё РѕРЅРё РјР°РїСЏС‚СЃСЏ
          employeeId: user.id,
          answers
        }, accessToken!);

        await ctx.editMessageText("рџЋ‰ <b>РЎРїР°СЃРёР±Рѕ Р·Р° СѓС‡Р°СЃС‚РёРµ!</b>\nР’Р°С€Рё РѕС‚РІРµС‚С‹ РїРѕРјРѕРіСѓС‚ РЅР°Рј СЃС‚Р°С‚СЊ Р»СѓС‡С€Рµ.", { parse_mode: "HTML" });

        // Clear survey state
        const updatedSession = await this.session.getSession(ctx.from.id);
        if (updatedSession) {
          delete updatedSession.surveyState;
          await this.session.saveSession(ctx.from.id, updatedSession);
        }
      } catch (e) {
        console.error("вќЊ Error submitting pulse:", e);
        await ctx.editMessageText("вќЊ РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° РїСЂРё СЃРѕС…СЂР°РЅРµРЅРёРё РѕС‚РІРµС‚РѕРІ.");
      }
    }
    await ctx.answerCbQuery();
  }


  @On("text")
  async onText(@Ctx() ctx: Context): Promise<void> {
    if (!ctx.message || !("text" in ctx.message) || !ctx.from) return;
    const message = (ctx.message as any).text;

    // Ignore commands
    if (message.startsWith("/")) return;

    const user = await this.getUser(ctx);
    if (!user) return;

    const accessToken = await this.getAccessToken(ctx);
    if (!accessToken) return;

    try {
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

        await ctx.reply("вњ… РџСЂРёС‡РёРЅР° РѕС‚РєР»РѕРЅРµРЅРёСЏ СЃРѕС…СЂР°РЅРµРЅР°.");
        return;
      }

      const taskId = session?.activeTaskId;

      await this.apiClient.createObservation({
        type: "CALL_LOG", // Representing Text/Speech
        intent: "MONITORING", // Default, Gate will upgrade to CONFIRMATION if needed
        content: message,
        taskId: taskId,
        // fieldId used to be required, now optional in schema
        timestamp: new Date().toISOString(),
      }, accessToken);

      // Acknowledge receipt (Dumb Transport Feedback)
      await ctx.reply("вњЌ РџСЂРёРЅСЏС‚Рѕ", { disable_notification: true });
    } catch (e) {
      console.error("вќЊ Error forwarding text observation:", e);
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
    const session = await this.session.getSession(ctx.from.id);
    if (!session?.token) return;

    const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Highest resolution
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);

    try {
      await this.apiClient.createObservation({
        type: "PHOTO",
        photoUrl: fileLink.toString(),
        taskId: session.activeTaskId,
        coordinates: session.currentCoordinates,
      }, session.token);

      await ctx.reply("рџ“ё Р¤РѕС‚Рѕ РїСЂРёРЅСЏС‚Рѕ РєР°Рє РґРѕРєР°Р·Р°С‚РµР»СЊСЃС‚РІРѕ (Strong Evidence). РџСЂРѕРІРµСЂСЏСЋ С†РµР»РѕСЃС‚РЅРѕСЃС‚СЊ...");
    } catch (e) {
      this.logger.error(`[TRANSPORT] Failed to forward photo: ${e.message}`);
      await ctx.reply("вќЊ РћС€РёР±РєР° РїСЂРё РїРµСЂРµРґР°С‡Рµ С„РѕС‚Рѕ РЅР° СЃРµСЂРІРµСЂ.");
    }
  }

  @On("voice")
  async onVoice(@Ctx() ctx: any) {
    if (!ctx.from || !ctx.message.voice) return;
    const session = await this.session.getSession(ctx.from.id);
    if (!session?.token) return;

    const fileLink = await ctx.telegram.getFileLink(ctx.message.voice.file_id);

    try {
      await this.apiClient.createObservation({
        type: "VOICE_NOTE",
        voiceUrl: fileLink.toString(),
        taskId: session.activeTaskId,
        coordinates: session.currentCoordinates,
      }, session.token);

      await ctx.reply("рџЋ™ Р“РѕР»РѕСЃРѕРІРѕР№ РѕС‚С‡РµС‚ РїСЂРёРЅСЏС‚. Р”Р°РЅРЅС‹Рµ РїРµСЂРµРґР°РЅС‹ РІ Back-Office.");
    } catch (e) {
      this.logger.error(`[TRANSPORT] Failed to forward voice: ${e.message}`);
      await ctx.reply("вќЊ РћС€РёР±РєР° РїСЂРё РїРµСЂРµРґР°С‡Рµ Р°СѓРґРёРѕ.");
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
      await ctx.reply(`рџ“Ќ РљРѕРѕСЂРґРёРЅР°С‚С‹ Р·Р°С„РёРєСЃРёСЂРѕРІР°РЅС‹: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. Р’СЃРµ РїРѕСЃР»РµРґСѓСЋС‰РёРµ РјРµРґРёР° Р±СѓРґСѓС‚ РёРјРµС‚СЊ GPS-РїРѕРґРїРёСЃСЊ.`);
    }
  }

  private readonly logger = new Logger(TelegramUpdate.name);

  private async renderQuestion(ctx: Context, survey: any, index: number) {
    const question = survey.questions[index];
    const text = `<b>РћРїСЂРѕСЃ: ${survey.title}</b>\n\nР’РѕРїСЂРѕСЃ ${index + 1}/${survey.questions.length}:\n${question.text}`;

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

