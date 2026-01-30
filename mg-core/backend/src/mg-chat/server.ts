/**
 * MG Chat Server
 * 
 * Express server for Telegram webhook integration.
 */

import express from 'express';
import dotenv from 'dotenv';
import { handleTelegramWebhook } from './integration';
import { initializeMGChat } from './index';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
// MG Chat MUST run on 3001 to avoid conflict with main backend (3000)
const PORT = 3001;
console.log(`[MG Chat Server] Configuration: Using Port ${PORT} (env.PORT was ${process.env.PORT})`);

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'mg-chat' });
});

// Telegram webhook
app.post('/webhook/telegram', handleTelegramWebhook);

// Initialize MG Chat contracts
try {
    initializeMGChat();
    console.log('[MG Chat Server] ✅ Contracts initialized');
} catch (error) {
    console.error('[MG Chat Server] ❌ Failed to initialize contracts:', error);
    process.exit(1);
}

// Start server
app.listen(PORT, () => {
    console.log(`[MG Chat Server] 🚀 Server running on port ${PORT}`);
    console.log(`[MG Chat Server] 📡 Webhook endpoint: http://localhost:${PORT}/webhook/telegram`);
    console.log(`[MG Chat Server] 🏥 Health check: http://localhost:${PORT}/health`);
});
