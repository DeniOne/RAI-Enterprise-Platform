/**
 * Delete Webhook Script
 * 
 * Removes Telegram webhook to enable long polling.
 */

const axios = require('axios');

const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

async function deleteWebhook() {
    try {
        console.log('[Webhook] Deleting webhook with drop_pending_updates=true...');

        const response = await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`,
            { drop_pending_updates: true }
        );

        if (response.data.ok) {
            console.log('✅ Webhook deleted successfully!');
            console.log('   Pending updates dropped');
        } else {
            console.error('❌ Failed to delete webhook:', response.data);
        }
    } catch (error) {
        console.error('❌ Error deleting webhook:', error.message);
    }
}

async function getWebhookInfo() {
    try {
        const response = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
        );

        console.log('\n📊 Current Webhook Info:');
        console.log(JSON.stringify(response.data.result, null, 2));
    } catch (error) {
        console.error('❌ Error getting webhook info:', error.message);
    }
}

(async () => {
    await deleteWebhook();
    await getWebhookInfo();
    console.log('\n✅ Now you can run: node test-local.js');
})();
