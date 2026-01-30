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
exports.PhotoOptimizationService = void 0;
const axios_1 = __importDefault(require("axios"));
const sharp_1 = __importDefault(require("sharp"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const crypto_1 = require("crypto");
class PhotoOptimizationService {
    static instance;
    uploadDir;
    telegramToken;
    constructor() {
        this.uploadDir = path.join(process.cwd(), 'uploads', 'registration');
        this.telegramToken = process.env.TELEGRAM_BOT_TOKEN || '';
        this.ensureUploadDir();
    }
    static getInstance() {
        if (!PhotoOptimizationService.instance) {
            PhotoOptimizationService.instance = new PhotoOptimizationService();
        }
        return PhotoOptimizationService.instance;
    }
    async ensureUploadDir() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
        }
        catch (error) {
            console.error('[PhotoOptimizationService] Error creating upload directory:', error);
        }
    }
    /**
     * Download and optimize photo from Telegram
     */
    async processTelegramPhoto(fileId, subDir = 'photos') {
        try {
            if (!this.telegramToken) {
                throw new Error('Telegram token not configured');
            }
            // 1. Get file path from Telegram
            const getFileUrl = `https://api.telegram.org/bot${this.telegramToken}/getFile?file_id=${fileId}`;
            const fileResponse = await axios_1.default.get(getFileUrl);
            const filePath = fileResponse.data.result.file_path;
            if (!filePath) {
                throw new Error('Could not get file path from Telegram');
            }
            // 2. Download file
            const downloadUrl = `https://api.telegram.org/file/bot${this.telegramToken}/${filePath}`;
            const imageResponse = await axios_1.default.get(downloadUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imageResponse.data);
            // 3. Optimize with Sharp
            const fileName = `${(0, crypto_1.randomUUID)()}.webp`;
            const targetPath = path.join(this.uploadDir, subDir);
            await fs.mkdir(targetPath, { recursive: true });
            const fullPath = path.join(targetPath, fileName);
            await (0, sharp_1.default)(buffer)
                .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(fullPath);
            // Return relative path for storage
            return `/uploads/registration/${subDir}/${fileName}`;
        }
        catch (error) {
            console.error('[PhotoOptimizationService] Error processing photo:', error);
            throw error;
        }
    }
}
exports.PhotoOptimizationService = PhotoOptimizationService;
exports.default = PhotoOptimizationService.getInstance();
