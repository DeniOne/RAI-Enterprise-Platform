import { Telegraf, Context, Markup, Scenes, session } from 'telegraf';
import employeeRegistrationService, { EmployeeRegistrationService } from './employee-registration.service';
import { prisma } from '../config/prisma';
import { foundationService } from './foundation.service';
import { FoundationStatus } from '../config/foundation.constants';

// Wizard Scene Definition
const taskWizard = new Scenes.WizardScene(
    'task-wizard',
    async (ctx: any) => {
        await ctx.reply('📝 Создание новой задачи\n\nВведите название задачи:');
        return ctx.wizard.next();
    },
    async (ctx: any) => {
        if (!ctx.message || !ctx.message.text) {
            await ctx.reply('Пожалуйста, введите текст.');
            return;
        }
        ctx.wizard.state.title = ctx.message.text;
        await ctx.reply('Введите описание задачи:');
        return ctx.wizard.next();
    },
    async (ctx: any) => {
        if (!ctx.message || !ctx.message.text) {
            await ctx.reply('Пожалуйста, введите текст.');
            return;
        }
        ctx.wizard.state.description = ctx.message.text;
        await ctx.reply('Выберите приоритет:', Markup.inlineKeyboard([
            [Markup.button.callback('🟢 Low', 'LOW'), Markup.button.callback('🟡 Medium', 'MEDIUM')],
            [Markup.button.callback('🟠 High', 'HIGH'), Markup.button.callback('🔴 Urgent', 'URGENT')]
        ]));
        return ctx.wizard.next();
    },
    async (ctx: any) => {
        if (!ctx.callbackQuery) {
            await ctx.reply('Пожалуйста, выберите приоритет, нажав на кнопку.');
            return;
        }

        const priority = ctx.callbackQuery.data;
        const { title, description } = ctx.wizard.state;
        const telegramId = ctx.from.id.toString();

        try {
            const user = await prisma.user.findFirst({ where: { telegram_id: telegramId } });
            if (!user) {
                await ctx.reply('❌ Ошибка: Пользователь не найден.');
                return ctx.scene.leave();
            }

            const task = await prisma.task.create({
                data: {
                    title,
                    description,
                    priority,
                    creator_id: user.id,
                    assignee_id: user.id, // Auto-assign to self for now
                    status: 'TODO'
                }
            });

            await ctx.reply(
                `✅ *Задача создана!*\n\n` +
                `📌 *${task.title}*\n` +
                `📝 ${task.description}\n` +
                `⚡ Приоритет: ${priority}`,
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            console.error('Error creating task:', error);
            await ctx.reply('❌ Произошла ошибка при создании задачи.');
        }

        await ctx.answerCbQuery();
        return ctx.scene.leave();
    }
);

class TelegramService {
    private bot: Telegraf<any> | null = null;
    private static instance: TelegramService;

    private constructor() { }

    public static getInstance(): TelegramService {
        if (!TelegramService.instance) {
            TelegramService.instance = new TelegramService();
        }
        return TelegramService.instance;
    }

    public getBot(): Telegraf<any> | null {
        return this.bot;
    }

    public async initializeBot(): Promise<void> {
        const token = process.env.TELEGRAM_BOT_TOKEN;

        if (!token) {
            console.warn('TELEGRAM_BOT_TOKEN not set. Telegram bot will not be initialized.');
            return;
        }

        this.bot = new Telegraf(token);

        // Middleware
        const stage = new Scenes.Stage([taskWizard]);
        this.bot.use(session());
        this.bot.use(stage.middleware());

        // Register command handlers
        this.registerCommands();

        // Start bot
        const usePolling = process.env.TELEGRAM_USE_POLLING === 'true';

        if (usePolling) {
            await this.bot.launch();
            console.log('✅ Telegram bot initialized successfully (polling mode)');
        } else {
            console.log('✅ Telegram bot initialized successfully (webhook mode)');
        }

        // Enable graceful stop
        process.once('SIGINT', () => this.bot?.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot?.stop('SIGTERM'));
    }

    private registerCommands(): void {
        if (!this.bot) return;

        // /start command
        this.bot.command('start', async (ctx) => {
            const telegramId = ctx.from.id.toString();
            const user = await prisma.user.findFirst({ where: { telegram_id: telegramId } });

            if (user) {
                const fullName = `${user.first_name} ${user.last_name}`;
                const status = (user as any).foundation_status;

                let message = `👋 Добро пожаловать обратно, ${fullName}!\n\n`;

                if (status !== FoundationStatus.ACCEPTED) {
                    message += `🧭 *Вам необходимо ознакомиться с Базой!*\n\n` +
                        `Это обязательный этап допуска к системе MatrixGin.\n` +
                        `Нажмите кнопку ниже, чтобы начать.`;
                } else {
                    message += `🎓 *MVP Learning Contour*\n\n` +
                        `Этот бот — ваш проводник в обучении.\n\n` +
                        `💡 *О MatrixCoin:*\n` +
                        `MatrixCoin — единица признания. В MVP Learning Contour используется только в обучающем контексте и не влияет на доход, статус или власть.\n\n` +
                        `📚 *Обучение:*\n` +
                        `• Добровольное участие\n` +
                        `• Рекомендации на основе реальных метрик PhotoCompany\n` +
                        `• Без давления и санкций\n\n` +
                        `Используйте меню ниже для навигации:`;
                }

                await ctx.reply(
                    message,
                    { parse_mode: 'Markdown', ...this.getMainMenuKeyboard(status) }
                );
            } else {
                // SECURITY: Self-Registration with Anti-Fraud check
                const existingRequest = await prisma.$queryRaw<any[]>`
                    SELECT id FROM employee_registration_requests 
                    WHERE telegram_id = ${telegramId} 
                    AND status IN ('PENDING'::registration_status, 'REVIEW'::registration_status, 'APPROVED'::registration_status)
                `;

                if (existingRequest.length > 0) {
                    await ctx.reply(
                        `⚠️ *У вас уже есть активная заявка на регистрацию.*\n\n` +
                        `Пожалуйста, завершите её или дождитесь решения администратора.`,
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    await ctx.reply(
                        `👋 Добро пожаловать в MatrixGin!\n\n` +
                        `Вы не найдены в системе.\n` +
                        `Если вы сотрудник, нажмите кнопку ниже для начала регистрации.\n\n` +
                        `Ваш Telegram ID: \`${telegramId}\``,
                        {
                            parse_mode: 'Markdown',
                            reply_markup: {
                                inline_keyboard: [[
                                    { text: '📝 Начать регистрацию', callback_data: 'start_registration' }
                                ]]
                            }
                        }
                    );
                }
            }
        });

        // /newtask command
        this.bot.command('newtask', async (ctx) => {
            if (await this.ensureAdmissionGuard(ctx)) {
                await ctx.scene.enter('task-wizard');
            }
        });

        // /mytasks command
        this.bot.command('mytasks', async (ctx) => {
            if (await this.ensureAdmissionGuard(ctx)) {
                await this.handleMyTasks(ctx);
            }
        });

        // /balance command
        this.bot.command('balance', async (ctx) => {
            if (await this.ensureAdmissionGuard(ctx)) {
                await this.handleBalance(ctx);
            }
        });

        // /profile command
        this.bot.command('profile', async (ctx) => {
            if (await this.ensureAdmissionGuard(ctx)) {
                await this.handleProfile(ctx);
            }
        });

        // MVP Learning Contour Commands
        this.bot.command('learning', async (ctx) => {
            if (await this.ensureAdmissionGuard(ctx)) {
                await this.handleLearning(ctx);
            }
        });

        this.bot.command('courses', async (ctx) => {
            if (await this.ensureAdmissionGuard(ctx)) {
                await this.handleCourses(ctx);
            }
        });

        this.bot.command('mycourses', async (ctx) => {
            if (await this.ensureAdmissionGuard(ctx)) {
                await this.handleMyCourses(ctx);
            }
        });

        this.bot.command('enroll', async (ctx) => {
            if (await this.ensureAdmissionGuard(ctx)) {
                await this.handleEnroll(ctx);
            }
        });

        // Handle callback queries
        this.bot.on('callback_query', async (ctx) => {
            await this.handleCallbackQuery(ctx);
        });

        // Handle photo uploads
        this.bot.on('photo', async (ctx) => {
            await this.handlePhotoUpload(ctx);
        });

        // Handle document uploads
        this.bot.on('document', async (ctx) => {
            await this.handleDocumentUpload(ctx);
        });

        // Handle text messages
        this.bot.on('text', async (ctx: any) => {
            if (ctx.scene && ctx.scene.current) return;

            const telegramId = ctx.from?.id.toString();
            const registration = await employeeRegistrationService.getRegistrationByTelegramId(telegramId);
            if (registration && (registration.status === 'PENDING' || registration.status === 'APPROVED')) {
                await employeeRegistrationService.handleRegistrationStep(ctx, registration);
                return;
            }

            const user = await this.getUserByTelegramId(telegramId);
            if (!user) {
                await ctx.reply('Пожалуйста, сначала привяжите ваш аккаунт. Используйте /start для инструкций.');
                return;
            }

            if (ctx.message.text === '➕ Новая задача') {
                if (await this.ensureAdmissionGuard(ctx)) {
                    await ctx.scene.enter('task-wizard');
                }
                return;
            }

            await ctx.reply(
                'Используйте команды для навигации:\n\n' +
                '/mytasks - Мои задачи\n' +
                '/newtask - Создать задачу\n' +
                '/balance - Мой баланс\n' +
                '/profile - Мой профиль',
                this.getMainMenuKeyboard((user as any).foundation_status)
            );
        });
    }

    private async ensureAdmissionGuard(ctx: Context): Promise<boolean> {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) return false;

        const user = await this.getUserByTelegramId(telegramId);
        if (!user) {
            await ctx.reply('Аккаунт не привязан. Используйте /start');
            return false;
        }

        // @ts-ignore
        if (user.foundation_status !== FoundationStatus.ACCEPTED) {
            await ctx.reply(
                `⚠️ *Доступ ограничен*\n\n` +
                `Для использования этой функции необходимо сначала ознакомиться с Базой и принять её.\n\n` +
                `Используйте /start для перехода к Базе.`,
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([[Markup.button.callback('🧭 Узнать Базу', 'start_foundation')]])
                }
            );
            return false;
        }

        return true;
    }

    private async handleMyTasks(ctx: Context): Promise<void> {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) return;

        const user = await this.getUserByTelegramId(telegramId);
        if (!user) return;

        const tasks = await prisma.task.findMany({
            where: {
                assignee_id: user.id,
                status: { in: ['IN_PROGRESS', 'TODO'] }
            },
            orderBy: { created_at: 'desc' },
            take: 5
        });

        if (tasks.length === 0) {
            await ctx.reply('📋 У вас нет активных задач');
            return;
        }

        for (const task of tasks) {
            const statusEmoji = task.status === 'IN_PROGRESS' ? '🔄' : '⏳';
            const priorityEmoji = task.priority === 'URGENT' ? '🔴' :
                task.priority === 'HIGH' ? '🟠' :
                    task.priority === 'MEDIUM' ? '🟡' : '🟢';

            const message = `${statusEmoji} ${priorityEmoji} *${task.title}*\n` +
                `ID: \`${task.id}\`\n` +
                `Награда: ${task.mc_reward || 0} MC`;

            const keyboard = Markup.inlineKeyboard([
                task.status === 'TODO'
                    ? Markup.button.callback('▶️ Начать', `start_task_${task.id}`)
                    : Markup.button.callback('✅ Завершить', `complete_task_${task.id}`)
            ]);

            await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
        }
    }

    private async handleBalance(ctx: Context): Promise<void> {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) return;

        const user = await this.getUserByTelegramId(telegramId);
        if (!user) return;

        const wallet = await prisma.wallet.findUnique({ where: { user_id: user.id } });
        if (!wallet) return;

        const message =
            `💰 *Ваш баланс:*\n\n` +
            `🪙 MatrixCoin: *${wallet.mc_balance}* MC\n` +
            `🔒 Заморожено: ${wallet.mc_frozen} MC`;

        await ctx.reply(message, { parse_mode: 'Markdown' });
    }

    private async handleProfile(ctx: Context): Promise<void> {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) return;

        const user = await this.getUserByTelegramId(telegramId);
        if (!user) return;

        const employee = await prisma.employee.findUnique({
            where: { user_id: user.id },
            include: { department: true }
        });

        const fullName = `${user.first_name} ${user.last_name}`;
        const message =
            `👤 *Профиль:*\n\n` +
            `Имя: ${fullName}\n` +
            `Email: ${user.email}\n` +
            `Департамент: ${employee?.department?.name || 'Не указан'}\n` +
            `Должность: ${employee?.position || 'Не указана'}`;

        await ctx.reply(message, { parse_mode: 'Markdown' });
    }

    private async handleCallbackQuery(ctx: any): Promise<void> {
        const data = ctx.callbackQuery.data;

        if (ctx.scene && ctx.scene.current) return;

        if (data === 'start_registration') {
            await employeeRegistrationService.startRegistration(ctx);
        } else if (data.startsWith('position_')) {
            const positionId = data.replace('position_', '');
            const telegramId = ctx.from?.id.toString();
            const registration = await employeeRegistrationService.getRegistrationByTelegramId(telegramId);
            if (registration) {
                await employeeRegistrationService.handlePositionCallback(ctx, registration, positionId);
            }
        } else if (data.startsWith('location_')) {
            const locationId = data.replace('location_', '');
            const telegramId = ctx.from?.id.toString();
            const registration = await employeeRegistrationService.getRegistrationByTelegramId(telegramId);
            if (registration) {
                await employeeRegistrationService.handleLocationCallback(ctx, registration, locationId);
            }
        } else if (data === 'complete_registration') {
            const telegramId = ctx.from?.id.toString();
            const registration = await employeeRegistrationService.getRegistrationByTelegramId(telegramId);
            if (registration) {
                await employeeRegistrationService.completeRegistration(ctx, registration);
            }
        } else if (data.startsWith('approve_login_')) {
            const sessionId = data.replace('approve_login_', '');
            await this.handleLoginDecision(ctx, sessionId, 'APPROVED');
        } else if (data.startsWith('reject_login_')) {
            const sessionId = data.replace('reject_login_', '');
            await this.handleLoginDecision(ctx, sessionId, 'REJECTED');
        } else if (data === 'upload_more_docs') {
            await ctx.reply('Отправь документ или фото документа.');
        } else if (data === 'start_foundation') {
            await this.handleFoundation(ctx);
        } else if (data.startsWith('view_foundation_block_')) {
            const blockId = data.replace('view_foundation_block_', '');
            const telegramId = ctx.from?.id.toString();
            const user = await this.getUserByTelegramId(telegramId);
            if (user) {
                try {
                    await foundationService.registerBlockView(user.id, blockId, 'TELEGRAM_BOT');
                    await this.handleFoundation(ctx);
                } catch (error: any) {
                    await ctx.reply(`❌ ${error.message}`);
                }
            }
        } else if (data === 'accept_foundation') {
            const telegramId = ctx.from?.id.toString();
            const user = await this.getUserByTelegramId(telegramId);
            if (user) {
                try {
                    const result = await foundationService.submitDecision(user.id, 'ACCEPT', 'TELEGRAM_BOT');
                    if (result.status === FoundationStatus.ACCEPTED) {
                        await ctx.reply(
                            `🎉 *База принята!*\n\n` +
                            `Добро пожаловать в систему MatrixGin в качестве полноправного участника.\n` +
                            `Теперь вам доступны все функции системы.`,
                            { parse_mode: 'Markdown', ...this.getMainMenuKeyboard(FoundationStatus.ACCEPTED) }
                        );

                        // CANON: If there is an approved registration, move to Phase 3 (Profile Completion)
                        const registration = await employeeRegistrationService.getRegistrationByTelegramId(telegramId!);
                        if (registration && registration.status === 'APPROVED' && registration.current_step !== 'COMPLETED') {
                            await employeeRegistrationService.startPhase3(ctx, registration);
                        }
                    }
                } catch (error: any) {
                    await ctx.reply(`❌ ${error.message}`);
                }
            }
        } else if (data === 'decline_foundation') {
            await ctx.reply('⚠️ Без принятия Базы доступ к системе останется ограниченным.');
        }

        // Feature routing with Admission Guard (Strict for base-protected features)
        const protectedKeys = [
            'my_tasks', 'my_balance', 'my_profile', 'new_task'
        ];
        if (protectedKeys.includes(data) || data.startsWith('start_task_') || data.startsWith('complete_task_')) {
            if (!(await this.ensureAdmissionGuard(ctx))) {
                await ctx.answerCbQuery();
                return;
            }

            if (data === 'my_tasks') {
                await this.handleMyTasks(ctx);
            } else if (data === 'my_balance') {
                await this.handleBalance(ctx);
            } else if (data === 'my_profile') {
                await this.handleProfile(ctx);
            } else if (data === 'new_task') {
                await ctx.scene.enter('task-wizard');
            } else if (data.startsWith('start_task_')) {
                const taskId = data.replace('start_task_', '');
                await this.updateTaskStatus(ctx, taskId, 'IN_PROGRESS');
            } else if (data.startsWith('complete_task_')) {
                const taskId = data.replace('complete_task_', '');
                await this.updateTaskStatus(ctx, taskId, 'DONE');
            }
        }

        await ctx.answerCbQuery();
    }

    private async updateTaskStatus(ctx: Context, taskId: string, status: any): Promise<void> {
        try {
            await prisma.task.update({
                where: { id: taskId },
                data: { status }
            });
            await ctx.reply(`✅ Статус задачи обновлен на: ${status}`);
        } catch (error) {
            console.error('Error updating task:', error);
            await ctx.reply('❌ Ошибка при обновлении статуса.');
        }
    }

    private async handleLearning(ctx: Context): Promise<void> {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) return;

        const user = await this.getUserByTelegramId(telegramId);
        if (!user) return;

        try {
            const { universityService } = require('./university.service');
            const dashboard = await universityService.getStudentDashboard(user.id);

            let message = `🎓 *Моё обучение*\n\n`;
            if (dashboard.activeCourses.length > 0) {
                message += `📚 *Активные курсы:*\n`;
                for (const course of dashboard.activeCourses) {
                    message += `• ${course.courseTitle} (${course.progress}%)\n`;
                }
                message += `\n`;
            }

            if (dashboard.recommendedCourses.length > 0) {
                message += `💡 *Рекомендации:*\n`;
                for (const rec of dashboard.recommendedCourses) {
                    message += `• ${rec.title}\n  Причина: ${rec.reason}\n`;
                }
            }
            await ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (error) {
            await ctx.reply('❌ Ошибка при загрузке данных обучения');
        }
    }

    private async handleCourses(ctx: Context): Promise<void> {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) return;
        const user = await this.getUserByTelegramId(telegramId);
        if (!user) return;

        try {
            const { universityService } = require('./university.service');
            const courses = await universityService.getCourses();
            if (courses.length === 0) {
                await ctx.reply('📚 Курсы пока не доступны');
                return;
            }
            let message = `📚 *Доступные курсы:*\n\n`;
            for (const course of courses.slice(0, 5)) {
                message += `*${course.title}*\nID: \`${course.id}\`\n\n`;
            }
            await ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (error) {
            await ctx.reply('❌ Ошибка при загрузке курсов');
        }
    }

    private async handleMyCourses(ctx: Context): Promise<void> {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) return;
        const user = await this.getUserByTelegramId(telegramId);
        if (!user) return;

        try {
            const { enrollmentService } = require('./enrollment.service');
            const myCourses = await enrollmentService.getMyCourses(user.id);
            let message = `📖 *Мои курсы:*\n\n`;
            if (myCourses.active.length > 0) {
                message += `🔄 *Активные:*\n`;
                for (const course of myCourses.active) {
                    message += `• ${course.courseTitle}\n`;
                }
            } else {
                message += `Вы ещё не записаны ни на один курс.`;
            }
            await ctx.reply(message, { parse_mode: 'Markdown' });
        } catch (error) {
            await ctx.reply('❌ Ошибка при загрузке ваших курсов');
        }
    }

    private async handleEnroll(ctx: any): Promise<void> {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) return;
        const user = await this.getUserByTelegramId(telegramId);
        if (!user) return;

        const parts = (ctx.message?.text || '').split(' ');
        if (parts.length < 2) {
            await ctx.reply('❌ Укажите ID курса: /enroll <course_id>');
            return;
        }

        try {
            const { enrollmentService } = require('./enrollment.service');
            await enrollmentService.enrollInCourse(user.id, parts[1]);
            await ctx.reply('✅ Вы успешно записаны на курс!', { parse_mode: 'Markdown' });
        } catch (error: any) {
            await ctx.reply('❌ Ошибка при записи на курс.');
        }
    }

    public async sendCourseCompletedNotification(userId: string, courseName: string, recognitionMC: number): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user?.telegram_id || !this.bot) return false;
            const message = `🎉 *Поздравляем!*\n\nВы завершили курс: *${courseName}*\nПризнание: ${recognitionMC} MC`;
            await this.bot.telegram.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' });
            return true;
        } catch (error) {
            return false;
        }
    }

    private getMainMenuKeyboard(foundationStatus: string = 'ACCEPTED') {
        const buttons = [];
        if (foundationStatus !== FoundationStatus.ACCEPTED) {
            buttons.push([Markup.button.callback('🧭 Узнать Базу', 'start_foundation')]);
            return Markup.inlineKeyboard(buttons);
        }
        buttons.push([
            Markup.button.callback('📋 Мои задачи', 'my_tasks'),
            Markup.button.callback('➕ Новая задача', 'new_task')
        ]);
        buttons.push([
            Markup.button.callback('💰 Баланс', 'my_balance'),
            Markup.button.callback('👤 Профиль', 'my_profile')
        ]);
        return Markup.inlineKeyboard(buttons);
    }

    private async getUserByTelegramId(telegramId: string) {
        return await prisma.user.findFirst({ where: { telegram_id: telegramId } });
    }

    public async linkUserAccount(userId: string, telegramId: string): Promise<void> {
        await prisma.user.update({ where: { id: userId }, data: { telegram_id: telegramId } });
    }

    public async sendNotification(userId: string, message: string): Promise<boolean> {
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user?.telegram_id || !this.bot) return false;
            await this.bot.telegram.sendMessage(user.telegram_id, message, { parse_mode: 'Markdown' });
            return true;
        } catch (error) {
            return false;
        }
    }

    public async sendLoginPush(sessionId: string, telegramId: string, ip?: string): Promise<boolean> {
        if (!this.bot) return false;
        const message = `🔐 *Запрос на вход*\n\nЭто вы?` + (ip ? `\n📍 IP: \`${ip}\`` : '');
        const keyboard = Markup.inlineKeyboard([[
            Markup.button.callback('✅ Да', `approve_login_${sessionId}`),
            Markup.button.callback('❌ Нет', `reject_login_${sessionId}`)
        ]]);
        try {
            await this.bot.telegram.sendMessage(telegramId, message, { parse_mode: 'Markdown', ...keyboard });
            return true;
        } catch (error) {
            return false;
        }
    }

    private async handleLoginDecision(ctx: any, sessionId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
        try {
            const session = await prisma.authSession.findUnique({ where: { id: sessionId } });
            if (!session || session.status !== 'PENDING') {
                await ctx.editMessageText('⚠️ Срок действия истек.');
                return;
            }
            await prisma.authSession.update({ where: { id: sessionId }, data: { status: status as any } });
            await ctx.editMessageText(status === 'APPROVED' ? '✅ Вход разрешен.' : '❌ Вход отклонен.');
        } catch (error) {
            await ctx.reply('❌ Ошибка решения.');
        }
    }

    private async handlePhotoUpload(ctx: any): Promise<void> {
        if (ctx.scene && ctx.scene.current) return;
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) return;
        const registration = await employeeRegistrationService.getRegistrationByTelegramId(telegramId);
        if (registration && (registration.status === 'PENDING' || registration.status === 'APPROVED')) {
            await employeeRegistrationService.handleRegistrationStep(ctx, registration);
        }
    }

    private async handleDocumentUpload(ctx: any): Promise<void> {
        if (ctx.scene && ctx.scene.current) return;
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) return;
        const registration = await employeeRegistrationService.getRegistrationByTelegramId(telegramId);
        if (registration && (registration.status === 'PENDING' || registration.status === 'APPROVED')) {
            await employeeRegistrationService.handleRegistrationStep(ctx, registration);
        }
    }

    private async handleFoundation(ctx: any): Promise<void> {
        const telegramId = ctx.from?.id.toString();
        if (!telegramId) return;
        const user = await this.getUserByTelegramId(telegramId);
        if (!user) {
            await ctx.reply('❌ Пользователь не найден. Пожалуйста, используйте /start');
            return;
        }

        const state = await foundationService.getImmersionState(user.id);

        if (state.status === FoundationStatus.ACCEPTED) {
            await ctx.reply('✅ Вы уже приняли Базу. Добро пожаловать!');
            return;
        }

        if (state.status === FoundationStatus.READY_TO_ACCEPT) {
            const keyboard = Markup.inlineKeyboard([[
                Markup.button.callback('📜 ПРИНЯТЬ БАЗУ', 'accept_foundation'),
                Markup.button.callback('❌ Отказаться', 'decline_foundation')
            ]]);
            await ctx.reply(
                '📜 *Принятие Базы*\n\n' +
                'Вы ознакомились со всеми блоками. Измените свою роль в системе, приняв Базу.\n\n' +
                'Готовы продолжить?',
                { parse_mode: 'Markdown', ...keyboard }
            );
            return;
        }

        // READING or NOT_STARTED
        const currentBlockIndex = state.progress;
        const block = state.blocks[currentBlockIndex];

        if (!block) {
            await ctx.reply('⚠️ Данные Базы временно недоступны.');
            return;
        }

        const message = `🧭 *Блок ${block.order}: ${block.title}*\n\n${block.description}`;

        // Robust URL construction
        const baseUrl = process.env.WEB_APP_URL || 'http://localhost:5173';
        // Encode only the dynamic part to ensure valid URL
        const safeBlockId = encodeURIComponent(block.id);
        const webUrl = `${baseUrl}/foundation/block/${safeBlockId}`;

        const nextLabel = (block.order === state.blocks.length) ? '🏁 Завершить ознакомление' : '➡️ Далее';

        // Validate URL - Telegram doesn't allow localhost. If invalid, fallback to homepage
        const isLocalhost = webUrl.includes('localhost') || webUrl.includes('127.0.0.1');
        const finalUrl = (webUrl.startsWith('http') && !isLocalhost) ? webUrl : 'https://matrixgin.com';

        const buttons = [
            [Markup.button.url('📖 Читать полностью (Web)', finalUrl)],
            [Markup.button.callback(nextLabel, `view_foundation_block_${block.id}`)]
        ];

        const keyboard = Markup.inlineKeyboard(buttons);

        if (block.videoUrl) {
            try {
                let videoSource: string | { source: string } = block.videoUrl;

                // If path is relative (starts with /), try to resolve it as a local file
                if (block.videoUrl.startsWith('/')) {
                    // Check if we are in dev/local environment or if the path is intended to be local
                    const projectRoot = process.cwd(); // Should be backend root

                    // Map /content/* to ../content/* (Canon: F:\Matrix_Gin\content)
                    // Remove leading slash to ensure path.join works correctly relative to parent
                    const relativePath = block.videoUrl.startsWith('/') ? block.videoUrl.substring(1) : block.videoUrl;
                    const localPath = require('path').join(projectRoot, '..', relativePath);

                    videoSource = { source: localPath };
                }

                await ctx.replyWithVideo(videoSource, {
                    caption: message,
                    parse_mode: 'Markdown',
                    ...keyboard
                });
            } catch (error) {
                console.error('Failed to send video:', error);

                // Fallback: If video fails, try to provide a link (but only if it looks like a URL)
                const isUrl = block.videoUrl.startsWith('http');
                const videoLink = isUrl ? `\n\n🎬 [Видео к блоку](${block.videoUrl})` : '';

                await ctx.reply(
                    `${message}${videoLink} \n\n⚠️ _(Видео недоступно)_`,
                    { parse_mode: 'Markdown', ...keyboard }
                );
            }
        } else {
            await ctx.reply(message, { parse_mode: 'Markdown', ...keyboard });
        }
    }
}

export default TelegramService.getInstance();
