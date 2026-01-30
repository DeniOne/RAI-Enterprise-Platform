/**
 * Store Controller
 * Module 08 — MatrixCoin-Economy
 * PHASE 2 — API LAYER
 */

// @ts-ignore
import { Controller, Post, Body, Headers, HttpException, HttpStatus, UseGuards, BadRequestException, ConflictException } from '@nestjs/common';
import { StorePurchaseService } from '../services/store-purchase.service';
import { PurchaseStatus } from '@prisma/client';
import { StoreEligibilityGuard } from '../guards/store-eligibility.guards';
import { MVPLearningContourGuard } from '../../guards/mvp-learning-contour.guard';

// DTO
export class PurchaseRequestDto {
    itemId: string;
}

@Controller('api/store')
@UseGuards(MVPLearningContourGuard)
export class StoreController {
    constructor(private readonly purchaseService: StorePurchaseService) { }

    /**
     * POST /api/store/purchase
     * Execute atomic item purchase
     */
    @Post('purchase')
    @UseGuards(StoreEligibilityGuard)
    public async purchase(
        @Body() body: PurchaseRequestDto,
        @Headers('Idempotency-Key') idempotencyKey: string,
        @Headers('X-User-Id') userId: string // Temporary header for phase 2 testing
    ) {
        // 1. Validation
        if (!idempotencyKey) {
            throw new BadRequestException('Idempotency-Key header is required');
        }
        if (!userId) {
            throw new BadRequestException('User-Id is required (Testing Mode)');
        }
        if (!body.itemId) {
            throw new BadRequestException('itemId is required in body');
        }

        try {
            // 2. Execute Purchase
            const result = await this.purchaseService.purchaseItem(
                userId,
                body.itemId,
                idempotencyKey
            );

            return {
                status: 'SUCCESS',
                data: result
            };

        } catch (error: any) {
            // 3. Error Mapping
            const message = error.message;

            switch (error.code || error.name) {
                case 'INSUFFICIENT_FUNDS':
                    throw new HttpException(message, HttpStatus.PAYMENT_REQUIRED); // 402

                case 'OUT_OF_STOCK':
                case 'LIMIT_EXCEEDED':
                case 'ITEM_INACTIVE':
                    throw new HttpException(message, HttpStatus.UNPROCESSABLE_ENTITY); // 422

                case 'IDEMPOTENCY_REJECTED':
                    throw new ConflictException(message); // 409

                case 'ITEM_NOT_FOUND':
                    throw new HttpException(message, HttpStatus.NOT_FOUND); // 404

                case 'CONCURRENT_REQUEST':
                    throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS); // 429

                default:
                    console.error('[StoreController] Unknown Error:', error);
                    throw new HttpException(
                        'Internal Purchase Error',
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
            }
        }
    }
}
