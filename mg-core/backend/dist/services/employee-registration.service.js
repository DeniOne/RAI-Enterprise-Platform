"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeRegistrationService = exports.RegistrationStep = exports.RegistrationStatus = void 0;
const telegraf_1 = require("telegraf");
const telegram_service_1 = __importDefault(require("./telegram.service"));
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const photo_optimization_service_1 = __importDefault(require("./photo-optimization.service"));
// Registration status types
var RegistrationStatus;
(function (RegistrationStatus) {
    RegistrationStatus["PENDING"] = "PENDING";
    RegistrationStatus["REVIEW"] = "REVIEW";
    RegistrationStatus["APPROVED"] = "APPROVED";
    RegistrationStatus["REJECTED"] = "REJECTED";
})(RegistrationStatus || (exports.RegistrationStatus = RegistrationStatus = {}));
// Registration step types
var RegistrationStep;
(function (RegistrationStep) {
    RegistrationStep["APPLICATION_NAME"] = "APPLICATION_NAME";
    RegistrationStep["APPLICATION_BRANCH"] = "APPLICATION_BRANCH";
    RegistrationStep["APPLICATION_POSITION"] = "APPLICATION_POSITION";
    RegistrationStep["APPLICATION_CONTACTS"] = "APPLICATION_CONTACTS";
    RegistrationStep["APPLICATION_SUBMITTED"] = "APPLICATION_SUBMITTED";
    RegistrationStep["BASE_GATE"] = "BASE_GATE";
    RegistrationStep["PROFILE_PHOTO"] = "PROFILE_PHOTO";
    RegistrationStep["PROFILE_BIRTH_DATE"] = "PROFILE_BIRTH_DATE";
    RegistrationStep["PROFILE_REG_ADDRESS"] = "PROFILE_REG_ADDRESS";
    RegistrationStep["PROFILE_RES_ADDRESS"] = "PROFILE_RES_ADDRESS";
    RegistrationStep["PROFILE_CONTACTS"] = "PROFILE_CONTACTS";
    RegistrationStep["PROFILE_PASSPORT"] = "PROFILE_PASSPORT";
    RegistrationStep["COMPLETED"] = "COMPLETED";
})(RegistrationStep || (exports.RegistrationStep = RegistrationStep = {}));
class EmployeeRegistrationService {
    static instance;
    eventEmitter;
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter || new event_emitter_1.EventEmitter2();
    }
    static getInstance() {
        if (!EmployeeRegistrationService.instance) {
            EmployeeRegistrationService.instance = new EmployeeRegistrationService();
        }
        return EmployeeRegistrationService.instance;
    }
    /**
     * Location admin invites employee by sending their Telegram ID to system admin
     * System admin initiates registration invitation
     */
    async sendRegistrationInvitation(telegramId, invitedByUserId, departmentId, locationId) {
        const bot = telegram_service_1.default.getBot();
        if (!bot) {
            throw new Error('Telegram bot not initialized');
        }
        // Create or get registration request
        let registration = await this.getRegistrationByTelegramId(telegramId);
        if (!registration) {
            // Create new registration request
            const result = await prisma_1.prisma.$queryRaw `
                INSERT INTO employee_registration_requests (
                    id,
                    telegram_id, 
                    status, 
                    current_step, 
                    invited_by,
                    department_id,
                    location_id,
                    invitation_sent_at,
                    updated_at
                ) VALUES (
                    ${(0, crypto_1.randomUUID)()},
                    ${telegramId}, 
                    'PENDING'::registration_status, 
                    'APPLICATION_NAME'::registration_step,
                    ${invitedByUserId},
                    ${departmentId || null},
                    ${locationId || null},
                    NOW(),
                    NOW()
                )
                RETURNING id, telegram_id
            `;
            if (result.length === 0) {
                throw new Error('Failed to create registration request');
            }
        }
        // Send welcome message with registration button
        const welcomeMessage = `🎉 *Приветствуем в системе RAI_EP!*\n\n` +
            `Для начала работы тебе необходимо пройти регистрацию и подать заявку в HR-отдел.\n\n` +
            `Нажми на кнопку ниже, чтобы начать.`;
        await bot.telegram.sendMessage(telegramId, welcomeMessage, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '▶️ Начать регистрацию', callback_data: 'start_registration' }]
                ]
            }
        });
    }
    /**
     * Start registration process
     */
    async startRegistration(ctx) {
        const telegramId = ctx.from?.id.toString();
        // @ts-ignore
        const username = ctx.from?.username;
        if (!telegramId)
            return;
        // Check/Create registration request
        const existing = await this.getRegistrationByTelegramId(telegramId);
        // CANON UPDATE: Strict Phase 1 - Minimal Data for HR Approval
        // Sequence: Full Name -> Location -> Position -> Submit to HR
        // Send "Full Name" prompt directly
        await ctx.reply(`📝 *Начинаем регистрацию*\n\n` +
            `👤 *Шаг 1/3: ФИО*\n\n` +
            `Введите ваши Фамилию, Имя и Отчество (если есть):\n` +
            `_Пример: Иванов Иван Иванович_`, {
            parse_mode: 'Markdown'
        });
        if (!existing) {
            await prisma_1.prisma.$executeRaw `
                INSERT INTO employee_registration_requests (
                    id,
                    telegram_id, 
                    telegram_username,
                    status, 
                    current_step, 
                    invitation_sent_at,
                    updated_at
                ) VALUES (
                    ${(0, crypto_1.randomUUID)()},
                    ${telegramId}, 
                    ${username || null},
                    'PENDING'::registration_status, 
                    'APPLICATION_NAME'::registration_step,
                    NOW(),
                    NOW()
                )
            `;
        }
        else {
            await prisma_1.prisma.$executeRaw `
                UPDATE employee_registration_requests
                SET current_step = 'APPLICATION_NAME'::registration_step,
                    updated_at = NOW()
                WHERE id = ${existing.id}
            `;
        }
    }
    /**
     * Handle registration step based on current step
     */
    async handleRegistrationStep(ctx, registration) {
        const currentStep = registration.current_step;
        switch (currentStep) {
            case 'APPLICATION_NAME':
                await this.handleFullNameStep(ctx, registration);
                break;
            case 'APPLICATION_BRANCH':
                await this.handleLocationStep(ctx, registration);
                break;
            case 'APPLICATION_POSITION':
                await this.handlePositionStep(ctx, registration);
                break;
            case 'BASE_GATE':
                await ctx.reply('🧭 Пожалуйста, ознакомься с Базой и прими её в главном меню для продолжения.');
                break;
            case 'PROFILE_PHOTO':
                await this.handlePhotoStep(ctx, registration);
                break;
            case 'PROFILE_BIRTH_DATE':
                await this.handleBirthDateStep(ctx, registration);
                break;
            case 'PROFILE_REG_ADDRESS':
                await this.handleAddressStep(ctx, registration, RegistrationStep.PROFILE_REG_ADDRESS);
                break;
            case 'PROFILE_RES_ADDRESS':
                await this.handleAddressStep(ctx, registration, RegistrationStep.PROFILE_RES_ADDRESS);
                break;
            case 'PROFILE_CONTACTS':
                await this.handlePhoneStep(ctx, registration);
                break;
            case 'PROFILE_PASSPORT':
                await this.handlePassportScanStep(ctx, registration);
                break;
            default:
                await ctx.reply('⚠️ Неизвестный шаг регистрации. Обратитесь в поддержку.');
        }
    }
    async handlePhotoStep(ctx, registration) {
        if (!ctx.message?.photo) {
            await ctx.reply('⚠️ *Пожалуйста, отправь именно фото (как картинку), а не файл.*\n\nЭто нужно для корректной работы профиля.', { parse_mode: 'Markdown' });
            return;
        }
        try {
            const photo = ctx.message.photo[ctx.message.photo.length - 1];
            const fileId = photo.file_id;
            await ctx.reply('⏳ _Обрабатываем фото..._', { parse_mode: 'Markdown' });
            // Optimize and save photo
            const optimizedPath = await photo_optimization_service_1.default.processTelegramPhoto(fileId, 'photos');
            const photoUrl = optimizedPath;
            await prisma_1.prisma.$executeRaw `
                UPDATE employee_registration_requests
                SET photo_url = ${photoUrl},
                    current_step = 'PROFILE_CONTACTS'::registration_step,
                    updated_at = NOW()
                WHERE id = ${registration.id}
            `;
            await this.saveStepHistory(registration.id, 'PROFILE_PHOTO', { photo_url: photoUrl });
            await ctx.reply(`✅ Фото сохранено!\n\n` +
                `📧 *Шаг: Контакты*\n\n` +
                `Введите ваш email:\n` +
                `_Например: ivanov@example.com_`, { parse_mode: 'Markdown' });
        }
        catch (error) {
            console.error('[EmployeeRegistrationService] Error in handlePhotoStep:', error);
            await ctx.reply('❌ Ошибка при обработке фото. Попробуй еще раз или отправь другое фото.');
        }
    }
    async handleFullNameStep(ctx, registration) {
        if (!ctx.message?.text) {
            await ctx.reply('Пожалуйста, введи текст');
            return;
        }
        const fullName = ctx.message.text.trim();
        const nameParts = fullName.split(' ').filter((part) => part.length > 0);
        if (nameParts.length < 2) {
            await ctx.reply('Пожалуйста, введи минимум Фамилию и Имя');
            return;
        }
        const lastName = nameParts[0];
        const firstName = nameParts[1];
        const middleName = nameParts.length > 2 ? nameParts.slice(2).join(' ') : null;
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET first_name = ${firstName},
                last_name = ${lastName},
                middle_name = ${middleName},
                current_step = 'APPLICATION_BRANCH'::registration_step,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'APPLICATION_NAME', {
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName
        });
        await this.promptLocationStep(ctx, registration);
    }
    async promptPositionStep(ctx) {
        // Fetch active positions
        const positions = await prisma_1.prisma.$queryRaw `
            SELECT id, name FROM positions WHERE is_active = true ORDER BY name
        `;
        if (positions.length === 0) {
            // Fallback to text if no positions defined
            await ctx.reply(`💼 *Шаг: Должность*\n\n` +
                `Введи должность, на которую устраиваешься:\n` +
                `_Например: Менеджер по продажам_`, { parse_mode: 'Markdown' });
            return;
        }
        const buttons = positions.map(p => [{
                text: p.name,
                callback_data: `position_${p.id}`
            }]);
        await ctx.reply(`💼 *Шаг: Должность*\n\n` +
            `Выбери должность из списка:`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: buttons
            }
        });
    }
    async handlePositionStep(ctx, registration) {
        const positions = await prisma_1.prisma.position.findMany({
            where: { is_active: true },
            orderBy: { name: 'asc' }
        });
        if (positions.length === 0) {
            await ctx.reply('⚠️ Список должностей пуст. Обратись к администратору.');
            return;
        }
        const buttons = positions.map(pos => telegraf_1.Markup.button.callback(pos.name, `position_${pos.id}`));
        // Group buttons by 2 in a row
        const keyboard = [];
        for (let i = 0; i < buttons.length; i += 2) {
            keyboard.push(buttons.slice(i, i + 2));
        }
        await ctx.reply(`💼 *Шаг 3/3: Должность*\n\n` +
            `Выбери свою должность из списка:`, {
            parse_mode: 'Markdown',
            ...telegraf_1.Markup.inlineKeyboard(keyboard)
        });
    }
    async handlePositionCallback(ctx, registration, positionId) {
        const position = await prisma_1.prisma.position.findUnique({ where: { id: positionId } });
        if (!position) {
            await ctx.reply('❌ Ошибка: Должность не найдена.');
            return;
        }
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET position = ${position.name},
                current_step = 'APPLICATION_SUBMITTED'::registration_step,
                status = 'REVIEW'::registration_status,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'APPLICATION_POSITION', { position: position.name });
        // Notify Admins
        await this.notifyAdminsAboutNewRegistration({
            ...registration,
            position: position.name,
            status: 'REVIEW'
        });
        await ctx.reply(`✅ *Заявка принята!*\n\n` +
            `Твои данные отправлены на проверку HR-менеджеру. Пожалуйста, ожидай уведомления о решении.`, { parse_mode: 'Markdown' });
    }
    async promptLocationStep(ctx, registration) {
        // Fetch available locations
        const locations = await prisma_1.prisma.$queryRaw `
            SELECT id, name, city FROM locations WHERE is_active = true ORDER BY name
        `;
        if (locations.length === 0) {
            // If no locations, skip
            await ctx.reply('⚠️ Локации не найдены. Обратитесь к администратору.');
            return;
        }
        // Create inline keyboard with locations
        const locationButtons = locations.map(loc => [{
                text: `${loc.name}${loc.city ? ` (${loc.city})` : ''}`,
                callback_data: `location_${loc.id}`
            }]);
        await ctx.reply(`✅ ФИО сохранено!\n\n` +
            `🏢 *Шаг 2/3: Филиал (Локация)*\n\n` +
            `Выбери локацию, где будешь работать:`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: locationButtons
            }
        });
    }
    async handleLocationStep(ctx, registration) {
        await ctx.reply('⚠️ Пожалуйста, выбери локацию из списка выше, нажав на кнопку.');
    }
    async handleBirthDateStep(ctx, registration) {
        if (!ctx.message?.text) {
            await ctx.reply('⚠️ Пожалуйста, введи дату рождения в формате ДД.ММ.ГГГГ');
            return;
        }
        const dateStr = ctx.message.text.trim();
        const dateParts = dateStr.split('.');
        if (dateParts.length !== 3) {
            await ctx.reply('⚠️ Неверный формат. Используй ДД.ММ.ГГГГ (например, 01.01.1990)');
            return;
        }
        const birthDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
        if (isNaN(birthDate.getTime())) {
            await ctx.reply('⚠️ Неверная дата. Пожалуйста, проверь правильность ввода.');
            return;
        }
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET birth_date = ${birthDate},
                current_step = 'PROFILE_REG_ADDRESS'::registration_step,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'PROFILE_BIRTH_DATE', { birthDate });
        await ctx.reply(`✅ Дата рождения сохранена!\n\n` +
            `🏠 *Шаг: Адрес прописки*\n\n` +
            `Введите адрес вашей регистрации по паспорту:`, { parse_mode: 'Markdown' });
    }
    async handleAddressStep(ctx, registration, step) {
        if (!ctx.message?.text) {
            await ctx.reply('⚠️ Пожалуйста, введите адрес текстом.');
            return;
        }
        const address = ctx.message.text.trim();
        const isRegAddress = step === RegistrationStep.PROFILE_REG_ADDRESS;
        const nextStep = isRegAddress ? RegistrationStep.PROFILE_RES_ADDRESS : RegistrationStep.PROFILE_CONTACTS;
        const nextPrompt = isRegAddress
            ? `🏠 *Шаг: Адрес проживания*\n\nВведите ваш фактический адрес проживания:`
            : `📧 *Шаг: Контакты*\n\nВведите ваш номер телефона:\n_Пример: +79991234567_`;
        if (isRegAddress) {
            await prisma_1.prisma.$executeRaw `UPDATE employee_registration_requests SET registration_address = ${address}, current_step = ${nextStep}::registration_step, updated_at = NOW() WHERE id = ${registration.id}`;
        }
        else {
            await prisma_1.prisma.$executeRaw `UPDATE employee_registration_requests SET residential_address = ${address}, current_step = ${nextStep}::registration_step, updated_at = NOW() WHERE id = ${registration.id}`;
        }
        await this.saveStepHistory(registration.id, step, { address });
        await ctx.reply(`✅ Адрес сохранен!\n\n` + nextPrompt, { parse_mode: 'Markdown' });
    }
    async handleLocationCallback(ctx, registration, locationId) {
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET location_id = ${locationId},
                current_step = 'APPLICATION_POSITION'::registration_step,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'APPLICATION_BRANCH', { location_id: locationId });
        await this.handlePositionStep(ctx, registration);
    }
    async handlePassportScanStep(ctx, registration) {
        if (!ctx.message?.photo && !ctx.message?.document) {
            await ctx.reply('⚠️ Пожалуйста, отправь фото или скан документа.');
            return;
        }
        try {
            let fileId;
            if (ctx.message.photo) {
                const photo = ctx.message.photo[ctx.message.photo.length - 1];
                fileId = photo.file_id;
            }
            else {
                fileId = ctx.message.document.file_id;
                // Check mime type if it's a document
                const mime = ctx.message.document.mime_type;
                if (mime && !mime.startsWith('image/') && mime !== 'application/pdf') {
                    await ctx.reply('❌ Неподдерживаемый формат. Пожалуйста, отправь фото (JPG/PNG) или PDF.');
                    return;
                }
            }
            await ctx.reply('⏳ _Сохраняем скан паспорта..._', { parse_mode: 'Markdown' });
            let passportUrl;
            // Only optimize if it's an image
            if (ctx.message.photo || (ctx.message.document && ctx.message.document.mime_type?.startsWith('image/'))) {
                passportUrl = await photo_optimization_service_1.default.processTelegramPhoto(fileId, 'passports');
            }
            else {
                passportUrl = `telegram://file/${fileId}`;
            }
            await prisma_1.prisma.$executeRaw `
                UPDATE employee_registration_requests
                SET passport_scan_url = ${passportUrl},
                    current_step = 'COMPLETED'::registration_step,
                    updated_at = NOW()
                WHERE id = ${registration.id}
            `;
            await this.saveStepHistory(registration.id, 'PROFILE_PASSPORT', { passport_scan_url: passportUrl });
            await ctx.reply(`✅ Скан паспорта сохранен!\n\n` +
                `🎉 *Все данные собраны!*\n\n` +
                `Нажми кнопку ниже, чтобы завершить регистрацию.`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Завершить регистрацию', callback_data: 'complete_registration' }]
                    ]
                }
            });
        }
        catch (error) {
            console.error('[EmployeeRegistrationService] Error in handlePassportScanStep:', error);
            await ctx.reply('❌ Ошибка при сохранении паспорта. Попробуй еще раз.');
        }
    }
    async handlePhoneStep(ctx, registration) {
        if (!ctx.message?.text) {
            await ctx.reply('⚠️ Пожалуйста, введи данные текстом.');
            return;
        }
        const input = ctx.message.text.trim();
        if (registration.phone === null) {
            const phone = input.replace(/[\s\-\(\)]/g, '');
            const phoneRegex = /^\+?[0-9]{10,15}$/;
            if (!phoneRegex.test(phone)) {
                await ctx.reply('⚠️ Неверный формат номера. Используй формат: +79991234567');
                return;
            }
            await prisma_1.prisma.$executeRaw `UPDATE employee_registration_requests SET phone = ${phone}, updated_at = NOW() WHERE id = ${registration.id}`;
            await ctx.reply('✅ Телефон сохранен!\n\n📧 Теперь введи свой email:', { parse_mode: 'Markdown' });
            return;
        }
        if (registration.email === null) {
            const email = input.toLowerCase();
            const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
            if (!emailRegex.test(email)) {
                await ctx.reply('⚠️ Неверный формат email. Проверь правильность ввода.');
                return;
            }
            await prisma_1.prisma.$executeRaw `
                UPDATE employee_registration_requests
                SET email = ${email},
                    current_step = 'PROFILE_PASSPORT'::registration_step,
                    updated_at = NOW()
                WHERE id = ${registration.id}
            `;
            // Update user email as well
            await prisma_1.prisma.user.update({
                where: { telegram_id: registration.telegram_id },
                data: { email: email }
            });
            await this.saveStepHistory(registration.id, 'PROFILE_CONTACTS', { phone: registration.phone, email });
            await ctx.reply(`✅ Email сохранен!\n\n` +
                `🎫 *Шаг: Скан паспорта*\n\n` +
                `Загрузи фото разворота паспорта с фотографией (как картинку или файл):`, { parse_mode: 'Markdown' });
        }
    }
    async completeRegistration(ctx, registration) {
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET current_step = 'COMPLETED'::registration_step,
                completed_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'COMPLETED', { completed: true });
        const user = await prisma_1.prisma.user.findUnique({ where: { telegram_id: registration.telegram_id } });
        if (user && user.foundation_status === 'ACCEPTED') {
            await prisma_1.prisma.$transaction([
                prisma_1.prisma.employee.create({
                    data: {
                        user_id: user.id,
                        department_id: registration.department_id,
                        position: registration.position,
                        hire_date: new Date()
                    }
                }),
                prisma_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        admission_status: client_1.AdmissionStatus.ADMITTED,
                        profile_completion_status: client_1.ProfileCompletionStatus.COMPLETED
                    }
                })
            ]);
            await ctx.reply(`🎉 *Поздравляем!*\n\n` +
                `Ваш профиль полностью заполнен, и вы зачислены в штат!\n\n` +
                `Добро пожаловать в проект RAI_EP! 😊`, { parse_mode: 'Markdown' });
        }
        else {
            await ctx.reply(`✅ *Профиль заполнен!*\n\n` +
                `Ваши данные приняты. После того как вы примете Базу, процесс зачисления будет завершен.`, { parse_mode: 'Markdown' });
        }
        await this.notifyAdminsAboutNewRegistration(registration);
    }
    async getRegistrationByTelegramId(telegramId) {
        const result = await prisma_1.prisma.$queryRaw `
            SELECT * FROM employee_registration_requests
            WHERE telegram_id = ${telegramId}
            ORDER BY created_at DESC
            LIMIT 1
        `;
        return result.length > 0 ? result[0] : null;
    }
    /**
     * Start Phase 3: Post-Base profile completion
     */
    async startPhase3(ctx, registration) {
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET current_step = 'PROFILE_PHOTO'::registration_step,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await prisma_1.prisma.user.update({
            where: { telegram_id: registration.telegram_id },
            data: { profile_completion_status: client_1.ProfileCompletionStatus.IN_PROGRESS }
        });
        await ctx.reply(`🎉 *База принята!*\n\n` +
            `Остался последний шаг — заполнить профиль.\n\n` +
            `🎨 *Шаг: Фото профиля*\n\n` +
            `Пожалуйста, загрузи свое фото для корпоративного профиля.`, { parse_mode: 'Markdown' });
    }
    async saveStepHistory(registrationId, step, data) {
        await prisma_1.prisma.$executeRaw `
            INSERT INTO registration_step_history (
                id, registration_id, step, data, completed_at
            ) VALUES (
                ${(0, crypto_1.randomUUID)()},
                ${registrationId},
                ${step}::registration_step,
                ${JSON.stringify(data)}::jsonb,
                NOW()
            );
        `;
    }
    async notifyAdminsAboutNewRegistration(registration) {
        const admins = await prisma_1.prisma.user.findMany({
            where: {
                role: { in: ['ADMIN', 'HR_MANAGER'] },
                telegram_id: { not: null }
            }
        });
        const bot = telegram_service_1.default.getBot();
        if (!bot)
            return;
        const message = `📋 *Новая заявка на регистрацию сотрудника*` + (registration.status === 'REVIEW' ? ` (Предв. заявка)` : ` (Завершение профиля)`) + `\n\n` +
            `👤 ${registration.last_name || ''} ${registration.first_name || ''} ${registration.middle_name || ''}\n` +
            (registration.email ? `📧 ${registration.email}\n` : '') +
            (registration.phone ? `📱 ${registration.phone}\n` : '') +
            `💼 ${registration.position || 'Не указана'}\n\n` +
            `Дата: ${new Date().toLocaleString('ru-RU')}`;
        for (const admin of admins) {
            if (admin.telegram_id) {
                try {
                    await bot.telegram.sendMessage(admin.telegram_id, message, {
                        parse_mode: 'Markdown'
                    });
                }
                catch (error) {
                    console.error(`Failed to notify admin ${admin.id}:`, error);
                }
            }
        }
    }
    async approveRegistration(registrationId, reviewedByUserId, overrides) {
        const registration = await prisma_1.prisma.employeeRegistrationRequest.findUnique({
            where: { id: registrationId }
        });
        if (!registration) {
            throw new Error('Registration not found');
        }
        const reg = registration;
        const finalDepartmentId = overrides?.departmentId || reg.department_id;
        const finalLocationId = overrides?.locationId || reg.location_id;
        if (!finalDepartmentId || !finalLocationId) {
            throw new Error('departmentId and locationId are required for approval');
        }
        if (reg.status === 'APPROVED') {
            throw new Error('Registration already approved');
        }
        // Phase 2 CANON: Create restricted User account
        const tempEmail = `${reg.telegram_id}@RAI_EP.local`;
        await prisma_1.prisma.user.upsert({
            where: { telegram_id: reg.telegram_id },
            update: {
                first_name: reg.first_name,
                last_name: reg.last_name,
                middle_name: reg.middle_name,
                status: client_1.UserStatus.ACTIVE,
                foundation_status: client_1.FoundationStatus.NOT_STARTED,
                department_id: finalDepartmentId,
            },
            create: {
                email: tempEmail,
                password_hash: await bcrypt.hash((0, crypto_1.randomUUID)(), 12),
                first_name: reg.first_name,
                last_name: reg.last_name,
                middle_name: reg.middle_name,
                telegram_id: reg.telegram_id,
                role: 'EMPLOYEE',
                status: client_1.UserStatus.ACTIVE,
                foundation_status: client_1.FoundationStatus.NOT_STARTED,
                profile_completion_status: client_1.ProfileCompletionStatus.LOCKED,
                department_id: finalDepartmentId,
            }
        });
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET status = 'APPROVED'::registration_status,
                reviewed_by = ${reviewedByUserId},
                reviewed_at = NOW(),
                updated_at = NOW(),
                department_id = ${finalDepartmentId},
                location_id = ${finalLocationId},
                current_step = 'BASE_GATE'::registration_step
            WHERE id = ${registrationId}
        `;
        const bot = telegram_service_1.default.getBot();
        if (bot) {
            await bot.telegram.sendMessage(reg.telegram_id, `✅ *Ваша заявка одобрена!*\n\n` +
                `Перед началом работы необходимо изучить и принять Базу RAI_EP.\n\n` +
                `Нажми кнопку ниже, чтобы начать. 🧭`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🧭 Узнать Базу', callback_data: 'start_foundation' }]
                    ]
                }
            });
        }
    }
    async rejectRegistration(registrationId, reviewedByUserId, reason) {
        const registration = await prisma_1.prisma.$queryRaw `
            SELECT telegram_id FROM employee_registration_requests WHERE id = ${registrationId}
        `;
        if (registration.length === 0) {
            throw new Error('Registration not found');
        }
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET status = 'REJECTED'::registration_status,
                reviewed_by = ${reviewedByUserId},
                reviewed_at = NOW(),
                rejection_reason = ${reason},
                updated_at = NOW()
            WHERE id = ${registrationId}
        `;
        const bot = telegram_service_1.default.getBot();
        if (bot) {
            await bot.telegram.sendMessage(registration[0].telegram_id, `❌ К сожалению, твоя заявка на регистрацию была отклонена.\n\n` +
                `Причина: ${reason}\n\n` +
                `Если у тебя есть вопросы, пожалуйста, свяжись с HR-отделом.`, { parse_mode: 'Markdown' });
        }
    }
}
exports.EmployeeRegistrationService = EmployeeRegistrationService;
exports.default = EmployeeRegistrationService.getInstance();
