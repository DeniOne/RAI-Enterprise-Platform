"use strict";
/**
 * MG Chat Server
 *
 * Express server for Telegram webhook integration.
 */
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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const integration_1 = require("./integration");
const index_1 = require("./index");
const path = __importStar(require("path"));
// Load environment variables
dotenv_1.default.config({ path: path.join(__dirname, '.env') });
const app = (0, express_1.default)();
// MG Chat MUST run on 3001 to avoid conflict with main backend (3000)
const PORT = 3001;
console.log(`[MG Chat Server] Configuration: Using Port ${PORT} (env.PORT was ${process.env.PORT})`);
// Middleware
app.use(express_1.default.json());
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'mg-chat' });
});
// Telegram webhook
app.post('/webhook/telegram', integration_1.handleTelegramWebhook);
// Initialize MG Chat contracts
try {
    (0, index_1.initializeMGChat)();
    console.log('[MG Chat Server] ✅ Contracts initialized');
}
catch (error) {
    console.error('[MG Chat Server] ❌ Failed to initialize contracts:', error);
    process.exit(1);
}
// Start server
app.listen(PORT, () => {
    console.log(`[MG Chat Server] 🚀 Server running on port ${PORT}`);
    console.log(`[MG Chat Server] 📡 Webhook endpoint: http://localhost:${PORT}/webhook/telegram`);
    console.log(`[MG Chat Server] 🏥 Health check: http://localhost:${PORT}/health`);
});
