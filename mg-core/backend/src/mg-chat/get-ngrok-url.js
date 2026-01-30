/**
 * Get ngrok URL
 * 
 * Fetches the current ngrok tunnel URL from the local API.
 */

const axios = require('axios');

async function getNgrokUrl() {
    try {
        const response = await axios.get('http://localhost:4040/api/tunnels');
        const tunnels = response.data.tunnels;

        if (tunnels.length === 0) {
            console.log('❌ No active ngrok tunnels found');
            console.log('   Make sure ngrok is running: ngrok http 3001');
            return;
        }

        const httpsTunnel = tunnels.find(t => t.proto === 'https');

        if (!httpsTunnel) {
            console.log('❌ No HTTPS tunnel found');
            return;
        }

        const url = httpsTunnel.public_url;
        console.log('✅ ngrok URL found:');
        console.log(`   ${url}`);
        console.log('');
        console.log('📋 Webhook URL:');
        console.log(`   ${url}/webhook/telegram`);
        console.log('');
        console.log('🚀 Next step:');
        console.log(`   node setup-webhook.js ${url}/webhook/telegram`);

        return url;
    } catch (error) {
        console.error('❌ Error getting ngrok URL:', error.message);
        console.log('');
        console.log('Make sure:');
        console.log('1. ngrok is running');
        console.log('2. ngrok web interface is accessible at http://localhost:4040');
    }
}

getNgrokUrl();
