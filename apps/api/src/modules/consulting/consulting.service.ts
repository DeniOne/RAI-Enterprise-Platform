import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";

@Injectable()
export class ConsultingService {
    private readonly logger = new Logger(ConsultingService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Открывает контекстный тред для консультации.
     * Вызывается при создании DeviationReview или по запросу из Integrity Gate.
     */
    async openConsultationThread(deviationReviewId: string) {
        this.logger.log(`[CONSULTING] Opening contextual thread for deviation ${deviationReviewId}`);

        const review = await this.prisma.deviationReview.findUnique({
            where: { id: deviationReviewId },
        });

        if (!review) {
            throw new Error(`DeviationReview ${deviationReviewId} not found`);
        }

        if (review.telegramThreadId) {
            this.logger.warn(`[CONSULTING] Thread already exists for deviation ${deviationReviewId}`);
            return review.telegramThreadId;
        }

        // В реальности здесь будет вызов Telegram Bot API для создания Topic в группе
        // Для Beta реализации мы генерируем виртуальный ID, который будет использован ботом
        const virtualThreadId = `tg_thread_${Date.now()}_${deviationReviewId.substring(0, 8)}`;

        await this.prisma.deviationReview.update({
            where: { id: deviationReviewId },
            data: { telegramThreadId: virtualThreadId },
        });

        this.logger.log(`[CONSULTING] Contextual thread registered: ${virtualThreadId}`);
        return virtualThreadId;
    }

    /**
     * Логирует сообщение из Telegram как часть контекста системы.
     */
    async logMessage(threadId: string, authorId: string, content: string) {
        // Каждое сообщение "якорится" на DeviationReview через threadId
        const review = await this.prisma.deviationReview.findFirst({
            where: { telegramThreadId: threadId },
        });

        if (!review) {
            this.logger.error(`[LAW-VIOLATION] Message received without valid context thread: ${threadId}`);
            return;
        }

        // Сохранение комментария в Бэк-офисе
        // TODO: Create generic Comment model or use existing reasoning/impact fields
        this.logger.log(`[CONSULTING] Message trace: Author ${authorId} -> Review ${review.id}`);
    }
}
