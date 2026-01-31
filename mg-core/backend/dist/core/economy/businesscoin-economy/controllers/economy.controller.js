"use strict";
/**
 * Economy API Controller
 * Module 08 — BusinessCoin-Economy
 * STEP 5 — PERSISTENCE & API
 *
 * ⚠️ STRICT CONTROLLER:
 * - Maps DTO -> Adapter
 * - Returns Adapter Result
 * - NO Business Logic
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
exports.EconomyController = void 0;
// @ts-ignore
const common_1 = require("@nestjs/common");
const economy_adapters_1 = require("../services/economy.adapters");
const economy_api_dto_1 = require("../dto/economy-api.dto");
const mvp_learning_contour_guard_1 = require("@/guards/mvp-learning-contour.guard");
// Placeholder for real Auth Guard (Step 6/Integration)
const MockAuthGuard = () => class {
};
let EconomyController = class EconomyController {
    storeAdapter;
    auctionAdapter;
    governanceAdapter;
    constructor(storeAdapter, auctionAdapter, governanceAdapter) {
        this.storeAdapter = storeAdapter;
        this.auctionAdapter = auctionAdapter;
        this.governanceAdapter = governanceAdapter;
    }
    /**
     * POST /economy/store/access
     * Check if user can access store.
     */
    async checkStoreAccess(dto) {
        // Strict mapping: DTO properties only
        return await this.storeAdapter.evaluateStoreAccess(dto.context.userId, dto.context.mcSnapshot, dto.context.metadata);
    }
    /**
     * POST /economy/auction/participate
     * Attempt to participate in an auction.
     */
    async participateInAuction(dto) {
        // Reconstruction of context from DTO would happen here or via pipe
        // For strictness, we assume DTO matches Context shape closely or use a Mapper
        // Here we pass "as any" to delegate strict validation to the Adapter/Core Guards
        // In real impl, we'd use a robust Mapper.
        return await this.auctionAdapter.participate(dto.context, {
            userId: dto.context.userId,
            mcSnapshot: dto.context.mcSnapshot,
            storeAccessDecision: dto.context.metadata?.storeAccessDecision
        });
    }
    /**
     * POST /economy/governance/evaluate
     * Check governance rules.
     */
    async evaluateGovernance(contextDto) {
        // Date string to Date object
        const context = {
            ...contextDto,
            timestamp: new Date(contextDto.timestamp),
            mcSnapshot: contextDto.mcSnapshot
        };
        return await this.governanceAdapter.evaluateGovernance(context);
    }
};
exports.EconomyController = EconomyController;
__decorate([
    (0, common_1.Post)('store/access'),
    (0, common_1.UseGuards)(mvp_learning_contour_guard_1.MVPLearningContourGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [economy_api_dto_1.EvaluateAccessDto]),
    __metadata("design:returntype", Promise)
], EconomyController.prototype, "checkStoreAccess", null);
__decorate([
    (0, common_1.Post)('auction/participate'),
    (0, common_1.UseGuards)(mvp_learning_contour_guard_1.MVPLearningContourGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [economy_api_dto_1.ParticipateAuctionDto]),
    __metadata("design:returntype", Promise)
], EconomyController.prototype, "participateInAuction", null);
__decorate([
    (0, common_1.Post)('governance/evaluate'),
    (0, common_1.UseGuards)(mvp_learning_contour_guard_1.MVPLearningContourGuard),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [economy_api_dto_1.EconomyUsageContextDto]),
    __metadata("design:returntype", Promise)
], EconomyController.prototype, "evaluateGovernance", null);
exports.EconomyController = EconomyController = __decorate([
    (0, common_1.Controller)('economy'),
    __metadata("design:paramtypes", [economy_adapters_1.StoreAccessAdapterService,
        economy_adapters_1.AuctionAdapterService,
        economy_adapters_1.GovernanceAdapterService])
], EconomyController);
