"use strict";
/**
 * MatrixCoin Economy Module Definition
 * Module 08 — MatrixCoin-Economy
 * STEP 5 — PERSISTENCE & API
 * STEP 6 — INTEGRATION BOUNDARIES
 *
 * Registers:
 * - Controllers
 * - Adapter Services
 * - Core Services (Pure)
 * - Repositories
 * - Integration Services (Read-Only)
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatrixCoinEconomyModule = void 0;
// @ts-ignore
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
// Controllers
const economy_controller_1 = require("./controllers/economy.controller");
const analytics_controller_1 = require("./controllers/analytics.controller");
// Adapters
const economy_adapters_1 = require("./services/economy.adapters");
// Core Services (Pure Logic Wrappers)
const store_eligibility_service_1 = require("./services/store-eligibility.service");
const store_purchase_service_1 = require("./services/store-purchase.service");
// Repositories
const audit_event_repository_1 = require("./services/audit-event.repository");
const persistence_repositories_1 = require("./services/persistence.repositories");
// Integration Services
const services_1 = require("./integration/services");
// Prisma Provider (Simple Factory)
const PrismaProvider = {
    provide: client_1.PrismaClient,
    useValue: new client_1.PrismaClient()
};
// MVP Learning Contour: Store, Analytics, GMC, Auctions DISABLED
// See: documentation/06-MVP-LEARNING-CONTOUR
// Uncomment for full system mode (v2.0)
let MatrixCoinEconomyModule = class MatrixCoinEconomyModule {
};
exports.MatrixCoinEconomyModule = MatrixCoinEconomyModule;
exports.MatrixCoinEconomyModule = MatrixCoinEconomyModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            economy_controller_1.EconomyController,
            // StoreController,              // MVP: DISABLED
            analytics_controller_1.EconomyAnalyticsController, // MVP: ENABLED (Guarded)
        ],
        providers: [
            // Infrastructure
            PrismaProvider,
            audit_event_repository_1.AuditEventRepository,
            persistence_repositories_1.MCSnapshotRepository,
            // AuctionEventRepository,           // MVP: DISABLED
            // GovernanceFlagRepository,         // MVP: DISABLED
            // Core Services (Pure)
            store_eligibility_service_1.StoreEligibilityService,
            store_purchase_service_1.StorePurchaseService,
            // AuctionEventService,              // MVP: DISABLED
            // GMCRecognitionBridgeService,      // MVP: DISABLED
            // EconomyGovernanceService,         // MVP: DISABLED
            // EconomyAnalyticsService,          // MVP: DISABLED
            // Adapters (Orchestration)
            economy_adapters_1.StoreAccessAdapterService,
            // AuctionAdapterService,            // MVP: DISABLED
            // GovernanceAdapterService,         // MVP: DISABLED
            // Integration Boundary (Read-Only)
            services_1.EconomyIntegrationReadService
        ],
        exports: [
            // Export Adapters for other modules integration
            economy_adapters_1.StoreAccessAdapterService,
            // AuctionAdapterService,            // MVP: DISABLED
            // GovernanceAdapterService,         // MVP: DISABLED
            // Export Read-Only Integration
            services_1.EconomyIntegrationReadService
        ]
    })
], MatrixCoinEconomyModule);
