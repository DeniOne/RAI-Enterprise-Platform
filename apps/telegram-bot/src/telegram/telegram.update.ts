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
        `⛔ <b>Доступ ограничен</b>\n\nПривет, ${username}! Твой Telegram ID (${ctx.from?.id}) не зарегистрирован в системе RAI_EP.\n\nЕсли ты коллега — нажми кнопку ниже, чтобы запросить доступ.`,
        {
          parse_mode: "HTML",
          ...Markup.inlineKeyboard([
            [Markup.button.callback("📝 Запросить доступ", "request_access")],
          ]),
        },
      );
      return;
    }

    const keyboard = Markup.keyboard([
      ["📋 Мои задачи", "📊 Прогресс"],
      ["📊 Опросы", "🧠 Рекомендации"]
    ]).resize();

    await ctx.reply(
      `👋 Добро пожаловать! Вы вошли как ${user.email ?? "Полевой работник"}.\nИспользуйте меню для навигации.`,
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

    await ctx.answerCbQuery("Запрос отправлен админу 🚀");
    await ctx.editMessageText(
      "✅ <b>Запрос отправлен!</b>\nЯ сообщу тебе, когда админ выдаст доступ.",
      { parse_mode: "HTML" },
    );

    // Notify Admin
    await ctx.telegram.sendMessage(
      ADMIN_TG_ID,
      `🔔 <b>НОВЫЙ ЗАПРОС ДОСТУПА</b>\n\n👤 Имя: ${name}\n🌐 Юзер: ${username}\n🆔 TG ID: <code>${tgId}</code>`,
      {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback("✅ Одобрить", `approve_user:${tgId}`),
            Markup.button.callback("❌ Отклонить", `decline_user:${tgId}`),
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


      await ctx.answerCbQuery("Пользователь одобрен! ✅");
      await ctx.editMessageText(`✅ Юзер с ID <code>${tgId}</code> теперь в системе!`, {
        parse_mode: "HTML",
      });

      // 4. Notify User
      await ctx.telegram.sendMessage(
        tgId,
        "🎉 <b>Твой доступ одобрен!</b>\nВведи /start, чтобы открыть меню.",
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

    await ctx.answerCbQuery("Запрос отклонен ❌");
    await ctx.editMessageText(`❌ Запрос от <code>${tgId}</code> отклонен.`, {
      parse_mode: "HTML",
    });

    // Notify User
    await ctx.telegram.sendMessage(
      tgId,
      "😔 Извини, твой запрос на доступ был отклонен админом.",
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

        await ctx.reply("✅ Причина отклонения сохранена.");
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
      await ctx.reply("✍ Принято", { disable_notification: true });
    } catch (e) {
      console.error("❌ Error forwarding text observation:", e);
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

      await ctx.reply("📸 Фото принято как доказательство (Strong Evidence). Проверяю целостность...");
    } catch (e) {
      this.logger.error(`[TRANSPORT] Failed to forward photo: ${e.message}`);
      await ctx.reply("❌ Ошибка при передаче фото на сервер.");
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

      await ctx.reply("🎤 Голосовой отчет принят. Данные переданы в Back-Office.");
    } catch (e) {
      this.logger.error(`[TRANSPORT] Failed to forward voice: ${e.message}`);
      await ctx.reply("❌ Ошибка при передаче аудио.");
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

  private readonly logger = new Logger(TelegramUpdate.name);

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

