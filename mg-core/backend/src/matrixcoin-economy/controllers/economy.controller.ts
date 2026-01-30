/**
 * Economy API Controller
 * Module 08 — MatrixCoin-Economy
 * STEP 5 — PERSISTENCE & API
 * 
 * ⚠️ STRICT CONTROLLER:
 * - Maps DTO -> Adapter
 * - Returns Adapter Result
 * - NO Business Logic
 */

// @ts-ignore
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import {
    StoreAccessAdapterService,
    AuctionAdapterService,
    GovernanceAdapterService
} from '../services/economy.adapters';
import { EvaluateAccessDto, ParticipateAuctionDto, EconomyUsageContextDto } from '../dto/economy-api.dto';
import { MVPLearningContourGuard } from '../../guards/mvp-learning-contour.guard';

// Placeholder for real Auth Guard (Step 6/Integration)
const MockAuthGuard = () => class { };

@Controller('economy')
export class EconomyController {
    constructor(
        private readonly storeAdapter: StoreAccessAdapterService,
        private readonly auctionAdapter: AuctionAdapterService,
        private readonly governanceAdapter: GovernanceAdapterService
    ) { }

    /**
     * POST /economy/store/access
     * Check if user can access store.
     */
    @Post('store/access')
    @UseGuards(MVPLearningContourGuard)
    async checkStoreAccess(@Body() dto: EvaluateAccessDto) {
        // Strict mapping: DTO properties only
        return await this.storeAdapter.evaluateStoreAccess(
            dto.context.userId,
            dto.context.mcSnapshot,
            dto.context.metadata
        );
    }

    /**
     * POST /economy/auction/participate
     * Attempt to participate in an auction.
     */
    @Post('auction/participate')
    @UseGuards(MVPLearningContourGuard)
    async participateInAuction(@Body() dto: ParticipateAuctionDto) {
        // Reconstruction of context from DTO would happen here or via pipe
        // For strictness, we assume DTO matches Context shape closely or use a Mapper
        // Here we pass "as any" to delegate strict validation to the Adapter/Core Guards
        // In real impl, we'd use a robust Mapper.
        return await this.auctionAdapter.participate(
            dto.context as any,
            {
                userId: dto.context.userId,
                mcSnapshot: dto.context.mcSnapshot as any,
                storeAccessDecision: (dto.context.metadata as any)?.storeAccessDecision
            } as any
        );
    }

    /**
     * POST /economy/governance/evaluate
     * Check governance rules.
     */
    @Post('governance/evaluate')
    @UseGuards(MVPLearningContourGuard)
    async evaluateGovernance(@Body() contextDto: EconomyUsageContextDto) {
        // Date string to Date object
        const context = {
            ...contextDto,
            timestamp: new Date(contextDto.timestamp),
            mcSnapshot: contextDto.mcSnapshot as any
        };

        return await this.governanceAdapter.evaluateGovernance(context);
    }
}
