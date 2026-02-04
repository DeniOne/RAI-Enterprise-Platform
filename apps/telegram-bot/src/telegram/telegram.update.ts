import { Update, Start, Hears, Ctx, Action } from "nestjs-telegraf";
import { Context, Markup } from "telegraf";
import { PrismaService } from "../shared/prisma/prisma.service";
import { ProgressService } from "./progress.service";
import { ApiClientService, TaskDto } from "../shared/api-client/api-client.service";
import * as fs from "fs";
import * as path from "path";

const ADMIN_TG_ID = "441610858";
const PERSISTENT_USERS_PATH = path.resolve(
  process.cwd(),
  "data/persistent_users.json",
);

// Temporary in-memory storage for user access tokens (for demo purposes)
// TODO: In production, store tokens securely in Redis or encrypted user session
const userTokens: Map<string, string> = new Map();

@Update()
export class TelegramUpdate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
    private readonly apiClient: ApiClientService,
  ) { }

  private async getUser(ctx: Context) {
    if (!ctx.from) return null;
    const telegramId = ctx.from.id.toString();
    return this.prisma.user.findFirst({
      where: { telegramId },
    });
  }

  private async savePersistentUser(user: {
    telegramId: string;
    email: string;
    role: string;
    accessLevel: string;
  }) {
    try {
      const dataDir = path.dirname(PERSISTENT_USERS_PATH);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

      let users: Array<{ telegramId: string; email: string; role: string; accessLevel: string }> = [];
      if (fs.existsSync(PERSISTENT_USERS_PATH)) {
        users = JSON.parse(fs.readFileSync(PERSISTENT_USERS_PATH, "utf8"));
      }

      const exists = users.find((u) => u.telegramId === user.telegramId);
      if (!exists) {
        users.push(user);
        fs.writeFileSync(PERSISTENT_USERS_PATH, JSON.stringify(users, null, 2));
      }
    } catch (e) {
      console.error("❌ Failed to save persistent user:", e);
    }
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

    // 1. Get default company
    const company = await this.prisma.company.findFirst();
    if (!company) {
      await ctx.reply(
        "❌ Ошибка: Компания не найдена. Сначала запустите setup_company.ts",
      );
      return;
    }

    try {
      const email = `tg_${tgId}@rai.local`;

      // 2. Create User in DB
      await this.prisma.user.upsert({
        where: { telegramId: tgId },
        update: {
          accessLevel: "ACTIVE",
          company: { connect: { id: company.id } },
        },
        create: {
          telegramId: tgId,
          email,
          role: "USER",
          accessLevel: "ACTIVE",
          company: { connect: { id: company.id } },
          emailVerified: true,
        },
      });

      // 3. Save to Persistence JSON
      await this.savePersistentUser({
        telegramId: tgId,
        email,
        role: "USER",
        accessLevel: "ACTIVE",
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

    // Get tasks from local database (for now, until proper token management)
    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: user.id,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        companyId: user.companyId,
      },
      include: {
        field: { select: { id: true, name: true } },
        season: { select: { id: true, year: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

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
        `${statusIcon} <b>${task.name}</b>\n📍 Поле: ${fieldName}\n📊 Статус: ${statusText}\n📅 Дата: ${task.plannedDate?.toLocaleDateString("ru-RU") ?? "Не указана"}`,
        {
          parse_mode: "HTML",
          ...Markup.inlineKeyboard([buttons]),
        },
      );
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
      // Update task directly in DB (simplified for MVP)
      await this.prisma.task.update({
        where: { id: taskId },
        data: { status: "IN_PROGRESS" },
      });

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
      // Update task directly in DB (simplified for MVP)
      await this.prisma.task.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

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

      // Store token for future API calls (in production use Redis)
      if (ctx.from) {
        userTokens.set(ctx.from.id.toString(), result.accessToken);
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
