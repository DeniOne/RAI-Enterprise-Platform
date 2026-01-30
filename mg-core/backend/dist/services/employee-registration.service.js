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
const telegram_service_1 = __importDefault(require("./telegram.service"));
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_1 = require("../config/prisma");
const email_service_1 = __importDefault(require("./email.service"));
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const photo_optimization_service_1 = __importDefault(require("./photo-optimization.service"));
// Registration status types
var RegistrationStatus;
(function (RegistrationStatus) {
    RegistrationStatus["PENDING"] = "PENDING";
    RegistrationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    RegistrationStatus["DOCUMENTS_PENDING"] = "DOCUMENTS_PENDING";
    RegistrationStatus["REVIEW"] = "REVIEW";
    RegistrationStatus["APPROVED"] = "APPROVED";
    RegistrationStatus["REJECTED"] = "REJECTED";
})(RegistrationStatus || (exports.RegistrationStatus = RegistrationStatus = {}));
// Registration step types
var RegistrationStep;
(function (RegistrationStep) {
    RegistrationStep["PHOTO"] = "PHOTO";
    RegistrationStep["FULL_NAME"] = "FULL_NAME";
    RegistrationStep["BIRTH_DATE"] = "BIRTH_DATE";
    RegistrationStep["REG_ADDRESS"] = "REG_ADDRESS";
    RegistrationStep["RES_ADDRESS"] = "RES_ADDRESS";
    RegistrationStep["PHONE"] = "PHONE";
    RegistrationStep["EMAIL"] = "EMAIL";
    RegistrationStep["POSITION"] = "POSITION";
    RegistrationStep["LOCATION"] = "LOCATION";
    RegistrationStep["PASSPORT_SCAN"] = "PASSPORT_SCAN";
    RegistrationStep["DOCUMENTS"] = "DOCUMENTS";
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
                    'PHOTO'::registration_step,
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
        const welcomeMessage = `🎉 Приветствуем Тебя в системе MatrixGin!\n\n` +
            `Добро пожаловать в нашу команду! Для завершения регистрации в системе, ` +
            `пожалуйста, нажми на кнопку ниже и пройди простой процесс регистрации.\n\n` +
            `Это займет всего несколько минут!`;
        await bot.telegram.sendMessage(telegramId, welcomeMessage, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📝 Начать регистрацию', callback_data: 'start_registration' }]
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
                    'IN_PROGRESS'::registration_status, 
                    'PHOTO'::registration_step,
                    NOW(),
                    NOW()
                )
            `;
        }
        else {
            // Resume logic
            await prisma_1.prisma.$executeRaw `
                UPDATE employee_registration_requests
                SET status = 'IN_PROGRESS'::registration_status,
                    current_step = 'PHOTO'::registration_step,
                    updated_at = NOW()
                WHERE telegram_id = ${telegramId}
            `;
        }
        // Send first step instructions
        await ctx.reply(`📸 *Шаг 1/11: Фото профиля*\n\n` +
            `Пожалуйста, отправь своё селфи.\n\n` +
            `Ты можешь:\n` +
            `• Сделать фото прямо сейчас 📷\n` +
            `• Загрузить из галереи 🖼️\n\n` +
            `_Фото должно быть четким и на нейтральном фоне_`, { parse_mode: 'Markdown' });
    }
    /**
     * Handle registration step based on current step
     */
    async handleRegistrationStep(ctx, registration) {
        const currentStep = registration.current_step;
        switch (currentStep) {
            case 'PHOTO':
                await this.handlePhotoStep(ctx, registration);
                break;
            case 'FULL_NAME':
                await this.handleFullNameStep(ctx, registration);
                break;
            case 'BIRTH_DATE':
                await this.handleBirthDateStep(ctx, registration);
                break;
            case 'REG_ADDRESS':
                await this.handleRegAddressStep(ctx, registration);
                break;
            case 'RES_ADDRESS':
                await this.handleResAddressStep(ctx, registration);
                break;
            case 'PHONE':
                await this.handlePhoneStep(ctx, registration);
                break;
            case 'EMAIL':
                await this.handleEmailStep(ctx, registration);
                break;
            case 'POSITION':
                await this.handlePositionStep(ctx, registration);
                break;
            case 'LOCATION':
                await this.handleLocationStep(ctx, registration);
                break;
            case 'PASSPORT_SCAN':
                await this.handlePassportScanStep(ctx, registration);
                break;
            case 'DOCUMENTS':
                await this.handleDocumentsStep(ctx, registration);
                break;
            default:
                await ctx.reply('Неизвестный шаг регистрации');
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
                    current_step = 'FULL_NAME'::registration_step,
                    updated_at = NOW()
                WHERE id = ${registration.id}
            `;
            await this.saveStepHistory(registration.id, 'PHOTO', { photo_url: photoUrl });
            await ctx.reply(`✅ Фото сохранено!\n\n` +
                `👤 *Шаг 2/11: ФИО*\n\n` +
                `Введи свои Фамилию, Имя и Отчество в формате:\n` +
                `_Иванов Иван Иванович_`, { parse_mode: 'Markdown' });
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
                current_step = 'BIRTH_DATE'::registration_step,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'FULL_NAME', {
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName
        });
        await ctx.reply(`✅ ФИО сохранено!\n\n` +
            `📅 *Шаг 3/11: Дата рождения*\n\n` +
            `Введи дату рождения в формате:\n` +
            `_ДД.ММ.ГГГГ (например: 15.03.1990)_`, { parse_mode: 'Markdown' });
    }
    async handleBirthDateStep(ctx, registration) {
        if (!ctx.message?.text) {
            await ctx.reply('Пожалуйста, введи текст');
            return;
        }
        const dateText = ctx.message.text.trim();
        const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
        const match = dateText.match(dateRegex);
        if (!match) {
            await ctx.reply('Неверный формат даты. Используй формат: ДД.ММ.ГГГГ (например: 15.03.1990)');
            return;
        }
        const [, day, month, year] = match;
        const birthDate = new Date(`${year}-${month}-${day}`);
        if (isNaN(birthDate.getTime())) {
            await ctx.reply('Некорректная дата. Пожалуйста, проверь и введи снова.');
            return;
        }
        // Check if person is at least 18 years old
        const age = this.calculateAge(birthDate);
        if (age < 18) {
            await ctx.reply('Вам должно быть не менее 18 лет для регистрации.');
            return;
        }
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET birth_date = ${birthDate}::date,
                current_step = 'REG_ADDRESS'::registration_step,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'BIRTH_DATE', { birth_date: birthDate.toISOString() });
        await ctx.reply(`✅ Дата рождения сохранена!\n\n` +
            `🏠 *Шаг 4/11: Адрес регистрации*\n\n` +
            `Введи адрес регистрации (по паспорту):\n` +
            `_Например: г. Минск, ул. Ленина, д. 10, кв. 5_`, { parse_mode: 'Markdown' });
    }
    async handleRegAddressStep(ctx, registration) {
        if (!ctx.message?.text) {
            await ctx.reply('Пожалуйста, введи текст');
            return;
        }
        const address = ctx.message.text.trim();
        if (address.length < 10) {
            await ctx.reply('Адрес слишком короткий. Пожалуйста, введи полный адрес.');
            return;
        }
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET registration_address = ${address},
                current_step = 'RES_ADDRESS'::registration_step,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'REG_ADDRESS', { registration_address: address });
        await ctx.reply(`✅ Адрес регистрации сохранен!\n\n` +
            `🏡 *Шаг 5/11: Адрес проживания*\n\n` +
            `Совпадает ли адрес проживания с адресом регистрации?`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Да, совпадает', callback_data: 'address_same' }],
                    [{ text: '❌ Нет, ввести другой', callback_data: 'address_different' }]
                ]
            }
        });
    }
    async handleResAddressStep(ctx, registration) {
        if (!ctx.message?.text) {
            await ctx.reply('Пожалуйста, введи текст');
            return;
        }
        const address = ctx.message.text.trim();
        if (address.length < 10) {
            await ctx.reply('Адрес слишком короткий. Пожалуйста, введи полный адрес.');
            return;
        }
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET residential_address = ${address},
                addresses_match = false,
                current_step = 'PHONE'::registration_step,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'RES_ADDRESS', {
            residential_address: address,
            addresses_match: false
        });
        await this.promptPhoneStep(ctx);
    }
    async handleAddressMatchCallback(ctx, registration, match) {
        if (match) {
            // Use registration address as residential address
            await prisma_1.prisma.$executeRaw `
                UPDATE employee_registration_requests
                SET residential_address = registration_address,
                    addresses_match = true,
                    current_step = 'PHONE'::registration_step,
                    updated_at = NOW()
                WHERE id = ${registration.id}
            `;
            await this.saveStepHistory(registration.id, 'RES_ADDRESS', { addresses_match: true });
            await this.promptPhoneStep(ctx);
        }
        else {
            await ctx.reply(`Введи адрес проживания:\n` +
                `_Например: г. Минск, ул. Победы, д. 25, кв. 12_`, { parse_mode: 'Markdown' });
        }
    }
    async promptPhoneStep(ctx) {
        await ctx.reply(`✅ Адрес проживания сохранен!\n\n` +
            `📱 *Шаг 6/11: Номер телефона*\n\n` +
            `Введи номер телефона в международном формате:\n` +
            `_Например: +375291234567_`, { parse_mode: 'Markdown' });
    }
    async handlePhoneStep(ctx, registration) {
        if (!ctx.message?.text) {
            await ctx.reply('Пожалуйста, введи текст');
            return;
        }
        const phone = ctx.message.text.trim().replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(phone)) {
            await ctx.reply('Неверный формат номера. Используй формат: +375291234567');
            return;
        }
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET phone = ${phone},
                current_step = 'EMAIL'::registration_step,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'PHONE', { phone });
        await ctx.reply(`✅ Телефон сохранен!\n\n` +
            `📧 *Шаг 7/11: Email*\n\n` +
            `Введи адрес электронной почты:\n` +
            `_Например: ivanov@example.com_`, { parse_mode: 'Markdown' });
    }
    async handleEmailStep(ctx, registration) {
        if (!ctx.message?.text) {
            await ctx.reply('Пожалуйста, введи текст');
            return;
        }
        const email = ctx.message.text.trim().toLowerCase();
        const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
        if (!emailRegex.test(email)) {
            await ctx.reply('Неверный формат email. Проверь правильность ввода.');
            return;
        }
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET email = ${email},
                current_step = 'POSITION'::registration_step,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'EMAIL', { email });
        await this.promptPositionStep(ctx);
    }
    async promptPositionStep(ctx) {
        // Fetch active positions
        const positions = await prisma_1.prisma.$queryRaw `
            SELECT id, name FROM positions WHERE is_active = true ORDER BY name
        `;
        if (positions.length === 0) {
            // Fallback to text if no positions defined
            await ctx.reply(`💼 *Шаг 8/11: Должность*\n\n` +
                `Введи должность, на которую устраиваешься:\n` +
                `_Например: Менеджер по продажам_`, { parse_mode: 'Markdown' });
            return;
        }
        const buttons = positions.map(p => [{
                text: p.name,
                callback_data: `position_${p.id}`
            }]);
        await ctx.reply(`💼 *Шаг 8/11: Должность*\n\n` +
            `Выбери должность из списка:`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: buttons
            }
        });
    }
    async handlePositionStep(ctx, registration) {
        await ctx.reply('⚠️ Пожалуйста, выбери должность из списка выше, нажав на кнопку.');
    }
    async handlePositionCallback(ctx, registration, positionId) {
        const position = await prisma_1.prisma.$queryRaw `
            SELECT name FROM positions WHERE id = ${positionId}
        `;
        if (position.length === 0) {
            await ctx.reply('❌ Ошибка: Должность не найдена.');
            return;
        }
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET position = ${position[0].name},
                current_step = 'LOCATION'::registration_step,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'POSITION', { positionId, positionName: position[0].name });
        await this.promptLocationStep(ctx, registration);
    }
    async promptLocationStep(ctx, registration) {
        // Fetch available locations
        const locations = await prisma_1.prisma.$queryRaw `
            SELECT id, name, city FROM locations WHERE is_active = true ORDER BY name
        `;
        if (locations.length === 0) {
            // If no locations, skip to passport scan
            await prisma_1.prisma.$executeRaw `
                UPDATE employee_registration_requests
                SET current_step = 'PASSPORT_SCAN'::registration_step,
                    updated_at = NOW()
                WHERE id = ${registration.id}
            `;
            await this.promptPassportScanStep(ctx);
            return;
        }
        // Create inline keyboard with locations
        const locationButtons = locations.map(loc => [{
                text: `${loc.name}${loc.city ? ` (${loc.city})` : ''}`,
                callback_data: `location_${loc.id}`
            }]);
        await ctx.reply(`✅ Должность сохранена!\n\n` +
            `📍 *Шаг 9/11: Локация*\n\n` +
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
    async handleLocationCallback(ctx, registration, locationId) {
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET location_id = ${locationId},
                current_step = 'PASSPORT_SCAN'::registration_step,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'LOCATION', { location_id: locationId });
        await this.promptPassportScanStep(ctx);
    }
    async promptPassportScanStep(ctx) {
        await ctx.reply(`✅ Локация выбрана!\n\n` +
            `🎫 *Шаг 10/11: Скан паспорта*\n\n` +
            `Загрузи скан или фото разворота паспорта с фотографией.\n\n` +
            `_Убедись, что все данные читаемы_`, { parse_mode: 'Markdown' });
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
                // For PDF or other documents, just record the TG file reference for now (or we could download it too)
                passportUrl = `telegram://file/${fileId}`;
            }
            await prisma_1.prisma.$executeRaw `
                UPDATE employee_registration_requests
                SET passport_scan_url = ${passportUrl},
                    current_step = 'DOCUMENTS'::registration_step,
                    updated_at = NOW()
                WHERE id = ${registration.id}
            `;
            await this.saveStepHistory(registration.id, 'PASSPORT_SCAN', { passport_scan_url: passportUrl });
            await ctx.reply(`✅ Скан паспорта сохранен!\n\n` +
                `📎 *Шаг 11/11: Дополнительные документы (опционально)*\n\n` +
                `Если есть дополнительные документы (дипломы, сертификаты и т.д.), ` +
                `можешь загрузить их сейчас.\n\n` +
                `Если нет, нажми "Завершить регистрацию"`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '✅ Завершить регистрацию', callback_data: 'complete_registration' }],
                        [{ text: '📎 Загрузить документы', callback_data: 'upload_more_docs' }]
                    ]
                }
            });
        }
        catch (error) {
            console.error('[EmployeeRegistrationService] Error in handlePassportScanStep:', error);
            await ctx.reply('❌ Ошибка при сохранении паспорта. Попробуй еще раз.');
        }
    }
    async handleDocumentsStep(ctx, registration) {
        if (!ctx.message?.photo && !ctx.message?.document) {
            await ctx.reply('Пожалуйста, отправь фото или документ');
            return;
        }
        let fileId;
        let fileName = 'document';
        let fileType = 'photo';
        if (ctx.message.photo) {
            const photo = ctx.message.photo[ctx.message.photo.length - 1];
            fileId = photo.file_id;
        }
        else {
            fileId = ctx.message.document.file_id;
            fileName = ctx.message.document.file_name || 'document';
            fileType = ctx.message.document.mime_type || 'application/octet-stream';
        }
        const fileUrl = `telegram://file/${fileId}`;
        // Get current documents
        const current = await prisma_1.prisma.$queryRaw `
            SELECT additional_documents FROM employee_registration_requests
            WHERE id = ${registration.id}
        `;
        const documents = current[0]?.additional_documents || [];
        documents.push({
            name: fileName,
            url: fileUrl,
            type: fileType,
            uploaded_at: new Date().toISOString()
        });
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET additional_documents = ${JSON.stringify(documents)}::jsonb,
                updated_at = NOW()
            WHERE id = ${registration.id}
        `;
        await ctx.reply(`✅ Документ сохранен!\n\n` +
            `Загружено документов: ${documents.length}\n\n` +
            `Можешь загрузить еще или завершить регистрацию.`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '✅ Завершить регистрацию', callback_data: 'complete_registration' }]
                ]
            }
        });
    }
    /**
     * Complete registration and submit for review
     */
    async completeRegistration(ctx, registration) {
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET status = 'REVIEW'::registration_status,
                current_step = 'COMPLETED'::registration_step,
                completed_at = NOW()
            WHERE id = ${registration.id}
        `;
        await this.saveStepHistory(registration.id, 'COMPLETED', { completed: true });
        await ctx.reply(`🎉 *Поздравляем!*\n\n` +
            `Регистрация успешно завершена!\n\n` +
            `Твои данные отправлены на проверку HR-отделу. ` +
            `Мы свяжемся с тобой в ближайшее время.\n\n` +
            `Спасибо за терпение! 😊`, { parse_mode: 'Markdown' });
        // Notify admin/HR about new registration
        await this.notifyAdminsAboutNewRegistration(registration);
    }
    /**
     * Get registration by Telegram ID
     */
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
     * Save step completion to history
     */
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
    /**
     * Calculate age from birth date
     */
    calculateAge(birthDate) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    /**
     * Notify admins about new registration
     */
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
        const message = `📋 *Новая заявка на регистрацию сотрудника*\n\n` +
            `👤 ${registration.last_name} ${registration.first_name} ${registration.middle_name || ''}\n` +
            `📧 ${registration.email}\n` +
            `📱 ${registration.phone}\n` +
            `💼 ${registration.position}\n\n` +
            `Дата подачи: ${new Date(registration.completed_at).toLocaleString('ru-RU')}`;
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
    /**
     * Approve registration and create user account
     * CRITICAL: Emits employee.onboarded event for Module 33 integration
     */
    async approveRegistration(registrationId, reviewedByUserId, overrides) {
        const registration = await prisma_1.prisma.$queryRaw `
            SELECT * FROM employee_registration_requests WHERE id = ${registrationId}
        `;
        if (registration.length === 0) {
            throw new Error('Registration not found');
        }
        const reg = registration[0];
        // Idempotency check: prevent duplicate approval
        if (reg.status === 'APPROVED') {
            console.warn(`[EmployeeRegistrationService] Registration ${registrationId} already approved`);
            throw new Error('Registration already approved');
        }
        // SECURITY: Generate secure token for password setup instead of temp password
        // @ts-ignore
        const resetToken = (0, crypto_1.randomUUID)();
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Random unguessable password hash
        // @ts-ignore
        const dummyPassword = (0, crypto_1.randomUUID)();
        const hashedPassword = await bcrypt.hash(dummyPassword, 12);
        const departmentId = overrides?.departmentId || reg.department_id;
        // Create user account
        const user = await prisma_1.prisma.user.create({
            data: {
                email: reg.email,
                password_hash: hashedPassword,
                first_name: reg.first_name,
                last_name: reg.last_name,
                middle_name: reg.middle_name,
                phone_number: reg.phone,
                telegram_id: reg.telegram_id,
                role: 'EMPLOYEE',
                status: 'ACTIVE',
                department_id: departmentId,
                // @ts-ignore
                must_reset_password: true,
                // @ts-ignore
                reset_password_token: resetToken,
                // @ts-ignore
                reset_token_expires_at: tokenExpiresAt,
                // @ts-ignore
                foundation_status: 'NOT_STARTED'
            }
        });
        // Send Set Password Link via Email
        await email_service_1.default.sendPasswordSetupLink(reg.email, resetToken);
        // Create employee record
        const employee = await prisma_1.prisma.employee.create({
            data: {
                user_id: user.id,
                department_id: departmentId,
                position: reg.position,
                hire_date: new Date()
            }
        });
        // Update registration status (transactional guard)
        await prisma_1.prisma.$executeRaw `
            UPDATE employee_registration_requests
            SET status = 'APPROVED'::registration_status,
                reviewed_by = ${reviewedByUserId},
                reviewed_at = NOW(),
                updated_at = NOW(),
                department_id = ${departmentId},
                location_id = ${overrides?.locationId ? overrides.locationId : reg.location_id}
            WHERE id = ${registrationId}
        `;
        // CRITICAL: Emit employee.onboarded event
        this.eventEmitter.emit('employee.onboarded', {
            employeeId: employee.id,
            userId: user.id,
            onboardedAt: new Date(),
            onboardedBy: reviewedByUserId,
            onboardedByRole: 'HR_MANAGER'
        });
        console.log(`[EmployeeRegistrationService] employee.onboarded event emitted for employee ${employee.id}`);
        // Notify employee about approval
        const bot = telegram_service_1.default.getBot();
        if (bot) {
            await bot.telegram.sendMessage(reg.telegram_id, `🎉 *Поздравляем!*\n\n` +
                `Твоя регистрация одобрена!\n\n` +
                `Добро пожаловать в команду MatrixGin! 🚀\n\n` +
                `На твой Email (${reg.email}) отправлена ссылка для установки пароля.`, { parse_mode: 'Markdown' });
        }
    }
    /**
     * Reject registration
     */
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
        // Notify employee about rejection
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
