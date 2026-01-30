import axios from 'axios';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import { randomUUID } from 'crypto';

export class PhotoOptimizationService {
    private static instance: PhotoOptimizationService;
    private readonly uploadDir: string;
    private readonly telegramToken: string;

    private constructor() {
        this.uploadDir = path.join(process.cwd(), 'uploads', 'registration');
        this.telegramToken = process.env.TELEGRAM_BOT_TOKEN || '';
        this.ensureUploadDir();
    }

    public static getInstance(): PhotoOptimizationService {
        if (!PhotoOptimizationService.instance) {
            PhotoOptimizationService.instance = new PhotoOptimizationService();
        }
        return PhotoOptimizationService.instance;
    }

    private async ensureUploadDir(): Promise<void> {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
        } catch (error) {
            console.error('[PhotoOptimizationService] Error creating upload directory:', error);
        }
    }

    /**
     * Download and optimize photo from Telegram
     */
    public async processTelegramPhoto(fileId: string, subDir: string = 'photos'): Promise<string> {
        try {
            if (!this.telegramToken) {
                throw new Error('Telegram token not configured');
            }

            // 1. Get file path from Telegram
            const getFileUrl = `https://api.telegram.org/bot${this.telegramToken}/getFile?file_id=${fileId}`;
            const fileResponse = await axios.get(getFileUrl);
            const filePath = fileResponse.data.result.file_path;

            if (!filePath) {
                throw new Error('Could not get file path from Telegram');
            }

            // 2. Download file
            const downloadUrl = `https://api.telegram.org/file/bot${this.telegramToken}/${filePath}`;
            const imageResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imageResponse.data);

            // 3. Optimize with Sharp
            const fileName = `${randomUUID()}.webp`;
            const targetPath = path.join(this.uploadDir, subDir);
            await fs.mkdir(targetPath, { recursive: true });
            const fullPath = path.join(targetPath, fileName);

            await sharp(buffer)
                .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(fullPath);

            // Return relative path for storage
            return `/uploads/registration/${subDir}/${fileName}`;
        } catch (error) {
            console.error('[PhotoOptimizationService] Error processing photo:', error);
            throw error;
        }
    }
}

export default PhotoOptimizationService.getInstance();
