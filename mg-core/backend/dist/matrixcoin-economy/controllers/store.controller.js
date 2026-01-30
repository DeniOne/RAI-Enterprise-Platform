"use strict";
/**
 * Store Controller
 * Module 08 — MatrixCoin-Economy
 * PHASE 2 — API LAYER
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreController = exports.PurchaseRequestDto = void 0;
// @ts-ignore
const common_1 = require("@nestjs/common");
const store_purchase_service_1 = require("../services/store-purchase.service");
const store_eligibility_guards_1 = require("../guards/store-eligibility.guards");
const mvp_learning_contour_guard_1 = require("../../guards/mvp-learning-contour.guard");
// DTO
class PurchaseRequestDto {
    itemId;
}
exports.PurchaseRequestDto = PurchaseRequestDto;
let StoreController = class StoreController {
    purchaseService;
    constructor(purchaseService) {
        this.purchaseService = purchaseService;
    }
    /**
     * POST /api/store/purchase
     * Execute atomic item purchase
     */
    async purchase(body, idempotencyKey, userId // Temporary header for phase 2 testing
    ) {
        // 1. Validation
        if (!idempotencyKey) {
            throw new common_1.BadRequestException('Idempotency-Key header is required');
        }
        if (!userId) {
            throw new common_1.BadRequestException('User-Id is required (Testing Mode)');
        }
        if (!body.itemId) {
            throw new common_1.BadRequestException('itemId is required in body');
        }
        try {
            // 2. Execute Purchase
            const result = await this.purchaseService.purchaseItem(userId, body.itemId, idempotencyKey);
            return {
                status: 'SUCCESS',
                data: result
            };
        }
        catch (error) {
            // 3. Error Mapping
            const message = error.message;
            switch (error.code || error.name) {
                case 'INSUFFICIENT_FUNDS':
                    throw new common_1.HttpException(message, common_1.HttpStatus.PAYMENT_REQUIRED); // 402
                case 'OUT_OF_STOCK':
                case 'LIMIT_EXCEEDED':
                case 'ITEM_INACTIVE':
                    throw new common_1.HttpException(message, common_1.HttpStatus.UNPROCESSABLE_ENTITY); // 422
                case 'IDEMPOTENCY_REJECTED':
                    throw new common_1.ConflictException(message); // 409
                case 'ITEM_NOT_FOUND':
                    throw new common_1.HttpException(message, common_1.HttpStatus.NOT_FOUND); // 404
                case 'CONCURRENT_REQUEST':
                    throw new common_1.HttpException(message, common_1.HttpStatus.TOO_MANY_REQUESTS); // 429
                default:
                    console.error('[StoreController] Unknown Error:', error);
                    throw new common_1.HttpException('Internal Purchase Error', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
};
exports.StoreController = StoreController;
__decorate([
    (0, common_1.Post)('purchase'),
    (0, common_1.UseGuards)(store_eligibility_guards_1.StoreEligibilityGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('Idempotency-Key')),
    __param(2, (0, common_1.Headers)('X-User-Id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PurchaseRequestDto, String, String]),
    __metadata("design:returntype", Promise)
], StoreController.prototype, "purchase", null);
exports.StoreController = StoreController = __decorate([
    (0, common_1.Controller)('api/store'),
    (0, common_1.UseGuards)(mvp_learning_contour_guard_1.MVPLearningContourGuard),
    __metadata("design:paramtypes", [store_purchase_service_1.StorePurchaseService])
], StoreController);
