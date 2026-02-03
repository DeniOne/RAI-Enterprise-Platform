import { Update, Start, Hears, Ctx, Action } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { TaskService } from '../task/task.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

@Update()
export class TelegramUpdate {
    constructor(
        private readonly taskService: TaskService,
        private readonly prisma: PrismaService,
    ) { }

    private async getUser(ctx: Context) {
        if (!ctx.from) return null;
        const telegramId = ctx.from.id.toString();
        console.log(`🔍 Telegram Auth Attempt: ID=${telegramId}, Username=${ctx.from.username}`);
        return this.prisma.user.findFirst({
            where: { telegramId },
        });
    }

    @Start()
    async onStart(@Ctx() ctx: Context): Promise<void> {
        const user = await this.getUser(ctx);
        if (!user) {
            await ctx.reply('⛔ Access Denied. Your Telegram ID is not linked to any account.');
            return;
        }
        await ctx.reply(`👋 Welcome! You are logged in as ${user.email ?? 'Field Worker'}.\nCommand: /mytasks`);
    }

    @Hears('/mytasks')
    async onMyTasks(@Ctx() ctx: Context): Promise<void> {
        const user = await this.getUser(ctx);
        if (!user) {
            await ctx.reply('⛔ Access Denied.');
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
                assigneeId: user.id,
                status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
            },
            include: {
                operation: true,
                field: true,
            },
        });

        if (tasks.length === 0) {
            await ctx.reply('✅ No pending tasks assigned to you.');
            return;
        }

        for (const task of tasks) {
            const operationName = task.operation?.name || 'Unnamed Operation';
            const fieldName = task.field?.name || 'Unknown Field';
            const statusIcon = task.status === TaskStatus.IN_PROGRESS ? '⏳' : '🆕';

            const buttons = [];
            if (task.status === TaskStatus.PENDING) {
                buttons.push(Markup.button.callback('▶ Start', `start_task:${task.id}`));
            } else if (task.status === TaskStatus.IN_PROGRESS) {
                buttons.push(Markup.button.callback('✅ Complete', `complete_task:${task.id}`));
            }

            await ctx.reply(
                `${statusIcon} *${operationName}*\n📍 Field: ${fieldName}\n📅 Date: ${task.plannedDate?.toLocaleDateString() ?? 'N/A'}`,
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([buttons]),
                },
            );
        }
    }

    @Action(/start_task:(.+)/)
    async onStartTask(@Ctx() ctx: Context): Promise<void> {
        if ('match' in ctx && ctx.match && ctx.match[1]) {
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
        if ('match' in ctx && ctx.match && ctx.match[1]) {
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
}
