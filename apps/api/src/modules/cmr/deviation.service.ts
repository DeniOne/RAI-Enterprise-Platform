import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ReviewStatus, ResponsibilityMode, ClientResponseStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DeviationService {
    constructor(private readonly prisma: PrismaService) { }

    async createReview(data: any) {
        return this.prisma.deviationReview.create({
            data: {
                ...data,
                status: ReviewStatus.OPEN,
                responsibilityMode: ResponsibilityMode.SHARED,
                // Default SLA: 48 hours from now
                slaExpiration: data.slaExpiration || new Date(Date.now() + 48 * 60 * 60 * 1000),
            },
        });
    }

    async handleSilence(reviewId: string) {
        // SLA Logic
        const review = await this.prisma.deviationReview.findUnique({ where: { id: reviewId } });
        if (!review) throw new NotFoundException('Review not found');

        const now = new Date();
        // Assuming slaExpiration is set. check if expired.
        if (review.slaExpiration && review.slaExpiration < now && review.clientResponseStatus === ClientResponseStatus.PENDING) {
            // Shift liability
            return this.prisma.deviationReview.update({
                where: { id: reviewId },
                data: {
                    liabilityShiftStatus: 'SHIFTED_TO_CLIENT',
                    responsibilityMode: ResponsibilityMode.CLIENT_ONLY,
                }
            });
        }
        return review;
    }

    @Cron(CronExpression.EVERY_HOUR)
    async checkSla() {
        const expiredReviews = await this.prisma.deviationReview.findMany({
            where: {
                status: ReviewStatus.OPEN,
                clientResponseStatus: ClientResponseStatus.PENDING,
                slaExpiration: { lt: new Date() },
                liabilityShiftStatus: null
            }
        });

        for (const review of expiredReviews) {
            await this.handleSilence(review.id);
        }
    }
}
