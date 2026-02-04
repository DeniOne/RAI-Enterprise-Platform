import { Update, Start, Hears, Ctx, Action } from "nestjs-telegraf";
import { Context, Markup } from "telegraf";
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

    const keyboard = Markup.keyboard([["📋 Мои задачи", "📊 Прогресс"]]).resize();

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
            ...Markup.inlineKeyboard([buttons]),
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

      await ctx.answerCbQuery("Задача начата! ▶");
      await ctx.editMessageText(
        (ctx.callbackQuery as any).message.text + "\n\n✅ <b>Задача начата!</b>",
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
}
