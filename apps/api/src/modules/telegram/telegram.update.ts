import { Update, Start, Hears, Ctx, Action } from "nestjs-telegraf";
import { Context, Markup } from "telegraf";
import { TaskService } from "../task/task.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { ProgressService } from "./progress.service";
import { TelegramAuthService } from "../../shared/auth/telegram-auth.service";
import { TaskStatus, AssetStatus } from "@rai/prisma-client";
import * as fs from "fs";
import * as path from "path";

const ADMIN_TG_ID = "441610858";
const PERSISTENT_USERS_PATH = path.resolve(
  process.cwd(),
  "data/persistent_users.json",
);

@Update()
export class TelegramUpdate {
  constructor(
    private readonly taskService: TaskService,
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
    private readonly telegramAuthService: TelegramAuthService,
  ) { }

  private async getUser(ctx: Context) {
    if (!ctx.from) return null;
    const telegramId = ctx.from.id.toString();
    // console.log(`🔍 Telegram Auth Attempt: ID=${telegramId}, Username=${ctx.from.username}`);
    return this.prisma.user.findFirst({ // tenant-lint:ignore telegramId is a global identity binding for bot session
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

      let users = [];
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

    const keyboard = Markup.keyboard([["📋 My Tasks", "📊 Прогресс"]]).resize();

    await ctx.reply(
      `👋 Welcome! You are logged in as ${user.email ?? "Field Worker"}.\nUse the menu below to navigate.`,
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

  @Hears("📋 My Tasks")
  @Hears("/mytasks")
  async onMyTasks(@Ctx() ctx: Context): Promise<void> {
    const user = await this.getUser(ctx);
    if (!user) {
      await ctx.reply("⛔ Access Denied.");
      return;
    }

    // Fetch pending tasks
    // We might need a specific method in TaskService that accepts userId directly without full context overkill,
    // or we construct the context manually.
    // Let's us direct prisma approach here for simplicity or better yet, use TaskService if accessible.
    // TaskService.createTasksFromSeason is for generation.
    // We need TaskService.getTasksForUser? It doesn't exist yet.
    // We'll use Prisma directly for reading to avoid over-engineering TaskService for now,
    // strictly reading PENDING/IN_PROGRESS tasks.

    const tasks = await this.prisma.task.findMany({
      where: {
        companyId: user.companyId,
        assigneeId: user.id,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
      },
      include: {
        operation: true,
        field: true,
      },
    });

    if (tasks.length === 0) {
      await ctx.reply("✅ No pending tasks assigned to you.");
      return;
    }

    for (const task of tasks) {
      const operationName = task.operation?.name || "Unnamed Operation";
      const fieldName = task.field?.name || "Unknown Field";
      const statusIcon = task.status === TaskStatus.IN_PROGRESS ? "⏳" : "🆕";

      const buttons = [];
      if (task.status === TaskStatus.PENDING) {
        buttons.push(
          Markup.button.callback("▶ Start", `start_task:${task.id}`),
        );
      } else if (task.status === TaskStatus.IN_PROGRESS) {
        buttons.push(
          Markup.button.callback("✅ Complete", `complete_task:${task.id}`),
        );
      }

      await ctx.reply(
        `${statusIcon} <b>${operationName}</b>\n📍 Field: ${fieldName}\n📅 Date: ${task.plannedDate?.toLocaleDateString() ?? "N/A"}`,
        {
          parse_mode: "HTML",
          ...Markup.inlineKeyboard([buttons]),
        },
      );
    }
  }

  @Action(/start_task:(.+)/)
  async onStartTask(@Ctx() ctx: Context): Promise<void> {
    if ("match" in ctx && ctx.match && ctx.match[1]) {
      const taskId = ctx.match[1];
      const user = await this.getUser(ctx);
      if (!user) return; // Returns void, correct

      try {
        await this.taskService.startTask(taskId, user, user.companyId);
        await ctx.reply(`▶ Task started!`);
        // Refresh logic could go here
      } catch (e) {
        await ctx.reply(`❌ Error: ${e.message}`);
      }
    }
  }

  @Action(/complete_task:(.+)/)
  async onCompleteTask(@Ctx() ctx: Context): Promise<void> {
    if ("match" in ctx && ctx.match && ctx.match[1]) {
      const taskId = ctx.match[1];
      const user = await this.getUser(ctx);
      if (!user) return;

      try {
        // For simplicity, we complete without actuals for now via bot, or mock them.
        // Constraint: completeTask requires actuals.
        // We might need a "Report Actuals" flow (Scenario).
        // For now, let's just mark complete with empty actuals to prove the flow.
        await this.taskService.completeTask(taskId, [], user, user.companyId);
        await ctx.reply(`✅ Task completed!`);
      } catch (e) {
        await ctx.reply(`❌ Error: ${e.message}`);
      }
    }
  }

  // Telegram 2FA Login Handlers
  @Action(/confirm_login:(.+)/)
  async onConfirmLogin(@Ctx() ctx: Context) {
    const match = (ctx as any).match;
    const sessionId = match[1];

    try {
      await this.telegramAuthService.confirmLogin(sessionId);
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
      await this.telegramAuthService.denyLogin(sessionId);
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

  @Action(/confirm_asset:(.+):(.+)/)
  async onConfirmAsset(@Ctx() ctx: Context) {
    const match = (ctx as any).match;
    const category = match[1];
    const assetId = match[2];

    const user = await this.getUser(ctx);
    if (!user) {
      await ctx.answerCbQuery("Access denied");
      return;
    }

    try {
      if (category === "MACHINERY") {
        const updated = await this.prisma.machinery.updateMany({
          where: { id: assetId, companyId: user.companyId },
          data: {
            status: AssetStatus.ACTIVE,
            confirmedByUserId: user.id,
            confirmedAt: new Date()
          }
        });
        if (updated.count !== 1) {
          throw new Error("Asset not found in tenant scope");
        }
      } else {
        const updated = await this.prisma.stockItem.updateMany({
          where: { id: assetId, companyId: user.companyId },
          data: {
            status: AssetStatus.ACTIVE,
            confirmedByUserId: user.id,
            confirmedAt: new Date()
          }
        });
        if (updated.count !== 1) {
          throw new Error("Asset not found in tenant scope");
        }
      }
      await ctx.answerCbQuery("Актив подтвержден! ✅");
      await ctx.editMessageText(`✅ <b>Актив добавлен в реестр.</b>\nПодтвердил: ${user?.name || user?.email || "System"}`, { parse_mode: "HTML" });
    } catch (e) {
      console.error("❌ Error confirming asset:", e);
      await ctx.answerCbQuery("Ошибка подтверждения ❌");
    }
  }
  @Action(/reject_asset:(.+):(.+)/)
  async onRejectAsset(@Ctx() ctx: Context) {
    const match = (ctx as any).match;
    const category = match[1];
    const assetId = match[2];

    const user = await this.getUser(ctx);
    if (!user) {
      await ctx.answerCbQuery("Access denied");
      return;
    }

    try {
      if (category === "MACHINERY") {
        const updated = await this.prisma.machinery.updateMany({
          where: { id: assetId, companyId: user.companyId },
          data: {
            status: AssetStatus.REJECTED,
            rejectionReason: "USER_REJECTED",
            confirmedByUserId: user.id,
          },
        });
        if (updated.count !== 1) {
          throw new Error("Asset not found in tenant scope");
        }
      } else {
        const updated = await this.prisma.stockItem.updateMany({
          where: { id: assetId, companyId: user.companyId },
          data: {
            status: AssetStatus.REJECTED,
            rejectionReason: "USER_REJECTED",
            confirmedByUserId: user.id,
          },
        });
        if (updated.count !== 1) {
          throw new Error("Asset not found in tenant scope");
        }
      }
      await ctx.answerCbQuery("РђРєС‚РёРІ РѕС‚РєР»РѕРЅРµРЅ вќЊ");
      await ctx.editMessageText("вќЊ <b>РџСЂРµРґР»РѕР¶РµРЅРёРµ РѕС‚РєР»РѕРЅРµРЅРѕ Рё Р°СЂС…РёРІРёСЂРѕРІР°РЅРѕ.</b>", { parse_mode: "HTML" });
    } catch (e) {
      console.error("вќЊ Error rejecting asset:", e);
      await ctx.answerCbQuery("РћС€РёР±РєР° РїСЂРё РѕС‚РєР»РѕРЅРµРЅРёРё");
    }
  }
}
