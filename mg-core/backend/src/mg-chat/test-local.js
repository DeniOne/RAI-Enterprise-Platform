/**
 * Local Testing Script (Long Polling)
 * 
 * Simple test without TypeScript - just sends messages back.
 * Use this when ngrok is not available.
 */

const axios = require('axios');

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

let offset = 0;

console.log('========================================');
console.log('MG Chat Local Testing (Long Polling)');
console.log('========================================');
console.log('Bot is running...');
console.log('Send messages to your bot in Telegram!');
console.log('Press Ctrl+C to stop');
console.log('========================================\n');

async function sendMessage(chatId, text, replyMarkup) {
    try {
        await axios.post(`${API_URL}/sendMessage`, {
            chat_id: chatId,
            text: text,
            reply_markup: replyMarkup
        });
        console.log('✅ Message sent');
    } catch (error) {
        console.error('❌ Error sending message:', error.message);
    }
}

async function answerCallbackQuery(callbackQueryId) {
    try {
        await axios.post(`${API_URL}/answerCallbackQuery`, {
            callback_query_id: callbackQueryId
        });
    } catch (error) {
        console.error('❌ Error answering callback:', error.message);
    }
}

async function getUpdates() {
    try {
        const response = await axios.get(`${API_URL}/getUpdates`, {
            params: {
                offset: offset,
                timeout: 30
            }
        });

        const updates = response.data.result;

        for (const update of updates) {
            offset = update.update_id + 1;
            await handleUpdate(update);
        }
    } catch (error) {
        console.error('❌ Error getting updates:', error.message);
    }
}

async function handleUpdate(update) {
    console.log(`\n[Update ${update.update_id}]`);

    // Text message
    if (update.message?.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text;

        console.log(`📨 Text: "${text}"`);

        // Simple echo response
        const response = {
            text: `Получено: "${text}"\n\n✅ MG Chat работает!\n\nДля полного функционала запустите:\nnpm run dev\n\nИ настройте webhook через ngrok.`,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '📋 Тест 1', callback_data: 'test_1' },
                        { text: '🎯 Тест 2', callback_data: 'test_2' }
                    ]
                ]
            }
        };

        await sendMessage(chatId, response.text, response.reply_markup);
    }

    // Callback query
    if (update.callback_query) {
        const chatId = update.callback_query.message.chat.id;
        const messageId = update.callback_query.message.message_id;
        const actionId = update.callback_query.data;

        console.log(`🔘 Callback: "${actionId}"`);

        await answerCallbackQuery(update.callback_query.id);

        // Edit message
        try {
            await axios.post(`${API_URL}/editMessageText`, {
                chat_id: chatId,
                message_id: messageId,
                text: `Нажата кнопка: ${actionId}\n\n✅ Callback работает!`,
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🔙 Назад', callback_data: 'back' }]
                    ]
                }
            });
            console.log('✅ Message edited');
        } catch (error) {
            console.error('❌ Error editing message:', error.message);
        }
    }
}

// Main loop
async function main() {
    console.log('🚀 Starting bot...\n');

    // Start polling
    while (true) {
        await getUpdates();
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
