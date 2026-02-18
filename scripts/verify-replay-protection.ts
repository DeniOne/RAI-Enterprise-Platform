import axios from 'axios';
import * as crypto from 'crypto';

const API_URL = 'http://localhost:3000/api/adaptive-learning/callback';

async function testReplayAttack() {
    console.log('🧪 Testing Replay Attack Protection...');

    const payload = { trainingRunId: 'test-run-123' };
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now().toString();

    const headers = {
        'x-rai-signature': 'dummy_sig',
        'x-rai-nonce': nonce,
        'x-rai-timestamp': timestamp,
    };

    try {
        // 1. First attempt
        console.log('🔹 Sending first callback...');
        const res1 = await axios.post(API_URL, payload, { headers });
        console.log(`✅ First attempt: ${res1.data.status}`);

        // 2. Replay attempt
        console.log('🔹 Sending replay callback (same nonce)...');
        try {
            await axios.post(API_URL, payload, { headers });
            console.error('❌ BUG: Replay attack succeeded!');
        } catch (e) {
            console.log(`✅ Correctly blocked replay attack. Error: ${e.response?.data?.message}`);
        }

        // 3. Expired timestamp test
        console.log('🔹 Sending callback with expired timestamp...');
        const oldTimestamp = (Date.now() - 600000).toString(); // 10 min ago
        try {
            await axios.post(API_URL, payload, {
                headers: { ...headers, 'x-rai-nonce': 'new_nonce', 'x-rai-timestamp': oldTimestamp }
            });
            console.error('❌ BUG: Expired timestamp allowed!');
        } catch (e) {
            console.log(`✅ Correctly blocked expired timestamp. Error: ${e.response?.data?.message}`);
        }

    } catch (error) {
        console.error('❌ Test failed execution:', error.message);
    }
}

// Запуск теста
// Примечание: Требуется запущенный сервер API.
// testReplayAttack();
console.log('🚀 Script verify-replay-protection.ts ready to run.');
