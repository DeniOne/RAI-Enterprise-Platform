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
      ["📊 Опросы"]
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
        await ctx.reply("❌ Ошибка: Компания не найдена на бэкенде.");
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
      await ctx.reply(`❌ Ошибка апрува: ${e.message}`);
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
      await ctx.reply("⛔ Доступ запрещён. Введите /start для регистрации.");
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
      console.error("❌ Error fetching tasks:", e);
      await ctx.reply("❌ Произошла ошибка при загрузке задач. Попробуйте позже.");
    }
  }

  @Action(/start_task:(.+)/)
  async onStartTask(@Ctx() ctx: Context): Promise<void> {
    if (!("match" in ctx && ctx.match)) return;
    if (!ctx.from) return;
    const taskId = ctx.match[1];

    const user = await this.getUser(ctx);
    if (!user) {
      await ctx.answerCbQuery("⛔ Доступ запрещён");
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
      await ctx.answerCbQuery("⛔ Доступ запрещён");
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
      await ctx.answerCbQuery("🔑 Требуется авторизация");
      return;
    }

    try {
      const techMap = await this.apiClient.getTechMapBySeason(seasonId, accessToken);

      // Find current stage (dummy logic: first unfinished)
      let report = `📜 <b>Технологическая карта</b>\n`;
      report += `Сезон ID: <code>${seasonId.slice(-6)}</code>\n\n`;

      for (const stage of techMap.stages) {
        report += `<b>[ ${stage.name} ]</b>\n`;
        for (const op of stage.operations) {
          report += `• ${op.name}\n`;
          if (op.resources && op.resources.length > 0) {
            const resList = op.resources.map((r: any) => `${r.name} (${r.amount}${r.unit})`).join(', ');
            report += `  └ 📦 ${resList}\n`;
          }
        }
        report += `\n`;
      }

      await ctx.reply(report, { parse_mode: "HTML" });
      await ctx.answerCbQuery();
    } catch (e) {
      console.error("❌ Error fetching tech map for bot:", e);
      await ctx.answerCbQuery("❌ Ошибка при загрузке техкарты");
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
      await ctx.answerCbQuery("Ошибка запуска");
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
          respondentId: user.id, // В идеале EmployeeProfile.id, но для B2 берем User.id если они мапятся
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

      await ctx.reply("🎙 Голосовой отчет принят. Данные переданы в Back-Office.");
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
