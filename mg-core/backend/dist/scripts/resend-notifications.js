"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load env vars
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const prisma = new client_1.PrismaClient();
async function resend() {
    console.log('📣 Starting approval notification resend script...');
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.error('❌ TELEGRAM_BOT_TOKEN not found in .env');
        process.exit(1);
    }
    // Use Telegraf's Telegram class directly to send messages without polling/conflict
    const telegram = new telegraf_1.Telegram(token);
    // Get all approved registrations that have a telegram_id
    const approvedRegistrations = await prisma.employeeRegistrationRequest.findMany({
        where: {
            status: 'APPROVED',
            NOT: {
                telegram_id: ''
            }
        }
    });
    console.log(`Found ${approvedRegistrations.length} approved registrations. Checking notifications...`);
    for (const reg of approvedRegistrations) {
        if (!reg.telegram_id)
            continue;
        console.log(`\n📨 Sending welcome message to ${reg.first_name} ${reg.last_name} (${reg.telegram_id})...`);
        try {
            const message = `<b>🎉 Поздравляем!</b>\n\n` +
                `Твоя регистрация одобрена!\n\n` +
                `Добро пожаловать в команду RAI_EP! 🚀\n\n` +
                `На твой Email (${reg.email}) отправлена ссылка для установки пароля.`;
            await telegram.sendMessage(reg.telegram_id, message, { parse_mode: 'HTML' });
            console.log(`✅ Message sent to ${reg.last_name}`);
        }
        catch (error) {
            console.error(`❌ Failed to send message to ${reg.last_name}: ${error.message}`);
        }
    }
    console.log('\n✨ All notifications processed.');
}
resend()
    .catch(console.error)
    .finally(async () => {
    await prisma.$disconnect();
});
