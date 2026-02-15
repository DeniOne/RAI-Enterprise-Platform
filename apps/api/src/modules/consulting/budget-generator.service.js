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
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_client_1 = require("@rai/prisma-client");
const crypto = __importStar(require("crypto"));
let BudgetGeneratorService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var BudgetGeneratorService = _classThis = class {
        constructor(prisma, unitService) {
            this.prisma = prisma;
            this.unitService = unitService;
            this.logger = new common_1.Logger(BudgetGeneratorService.name);
        }
        /**
         * Generates an OPERATIONAL budget from an Active TechMap.
         * Enforces deterministic calculation and complete traceability.
         */
        async generateOperationalBudget(techMapId, userId) {
            // 1. Fetch TechMap with full hierarchy
            const techMap = await this.prisma.techMap.findUnique({
                where: { id: techMapId },
                include: {
                    stages: {
                        include: {
                            operations: {
                                include: {
                                    resources: true
                                }
                            }
                        }
                    },
                    field: true // Need area
                }
            });
            if (!techMap)
                throw new common_1.NotFoundException('TechMap not found');
            if (techMap.status !== prisma_client_1.TechMapStatus.ACTIVE) {
                throw new common_1.BadRequestException('Budget can only be generated from an ACTIVE TechMap');
            }
            // 2. Fetch Prices (Mock/Phase 2.1: Use costPerUnit from TechMap as "Planned Price" snapshot)
            // In Phase 3, this would fetch from a PriceBook or Procurement Contract.
            // For Phase 2, we respect the 'costPerUnit' defined in the TechMap as the "Standard Cost".
            // 3. Calculation & Deterministic Structure
            const budgetLines = this.calculateBudgetLines(techMap);
            // 4. Calculate Hash
            const derivationHash = this.calculateDerivationHash(techMap.id, techMap.version, budgetLines);
            // 5. Transactional Creation
            return this.prisma.$transaction(async (tx) => {
                // Check if exists for this version?
                const existing = await tx.budgetPlan.findFirst({
                    where: {
                        harvestPlanId: techMap.harvestPlanId,
                        version: techMap.version, // Link version to version? Or just strict link?
                        type: prisma_client_1.BudgetType.OPERATIONAL
                    }
                });
                if (existing) {
                    // If exists and DRAFT, update? Or throwing error?
                    // Phase 2 strict: One Budget per TechMap Version.
                    throw new common_1.BadRequestException(`Operational Budget already exists for TechMap v${techMap.version}`);
                }
                const header = await tx.budgetPlan.create({
                    data: {
                        harvestPlanId: techMap.harvestPlanId,
                        seasonId: techMap.seasonId,
                        companyId: techMap.companyId,
                        version: techMap.version,
                        type: prisma_client_1.BudgetType.OPERATIONAL,
                        status: prisma_client_1.BudgetStatus.DRAFT,
                        derivationHash: derivationHash,
                        techMapSnapshotId: techMap.id,
                        totalPlannedAmount: budgetLines.reduce((sum, l) => sum + l.totalCost, 0)
                    }
                });
                if (budgetLines.length > 0) {
                    await tx.budgetItem.createMany({
                        data: budgetLines.map(l => ({
                            budgetPlanId: header.id,
                            category: l.category, // Need mapping
                            plannedAmount: l.totalCost,
                            actualAmount: 0
                        }))
                    });
                }
                return header;
            });
        }
        calculateBudgetLines(techMap) {
            const area = techMap.field.area;
            const lines = [];
            for (const stage of techMap.stages) {
                for (const op of stage.operations) {
                    for (const res of op.resources) {
                        // Norm * Area * Price
                        const norm = res.amount; // Already normalized? Need to check unit compatibility?
                        // TechMap Validation ensures units are known. 
                        // But assume 'amount' is per HA? Yes, standard agronomy.
                        // If unit is 'kg/ha', then amount * area.
                        // What if unit is 'hours'? Machinery.
                        // Assuming TechMap 'amount' is 'Rate per Ha' for materials.
                        const quantity = norm * area;
                        const price = res.costPerUnit || 0;
                        const totalCost = quantity * price;
                        lines.push({
                            resourceId: res.id,
                            name: res.name,
                            category: this.mapResourceToCategory(res.type),
                            totalCost
                        });
                    }
                }
            }
            return lines;
        }
        mapResourceToCategory(type) {
            const t = type.toUpperCase();
            if (t.includes('SEED'))
                return 'SEEDS';
            if (t.includes('FERT'))
                return 'FERTILIZER';
            if (t.includes('FUEL'))
                return 'FUEL';
            if (t.includes('LABOR'))
                return 'LABOR';
            if (t.includes('MACH'))
                return 'MACHINERY';
            return 'OTHER';
        }
        calculateDerivationHash(mapId, version, lines) {
            // Stable sort
            lines.sort((a, b) => a.resourceId.localeCompare(b.resourceId));
            const payload = {
                mapId,
                version,
                lines: lines.map(l => ({ n: l.name, c: l.totalCost }))
            };
            return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
        }
    };
    __setFunctionName(_classThis, "BudgetGeneratorService");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        BudgetGeneratorService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return BudgetGeneratorService = _classThis;
})();
exports.BudgetGeneratorService = BudgetGeneratorService;
