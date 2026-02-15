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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_client_1 = require("@rai/prisma-client");
const crypto = __importStar(require("crypto"));
@(0, common_1.Injectable)()
class BudgetGeneratorService {
    prisma;
    unitService;
    logger = new common_1.Logger(BudgetGeneratorService.name);
    constructor(prisma, unitService) {
        this.prisma = prisma;
        this.unitService = unitService;
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
                        category: l.category,
                        plannedNorm: l.plannedNorm,
                        plannedPrice: l.plannedPrice,
                        plannedAmount: l.totalCost,
                        actualAmount: 0
                    }))
                });
            }
            return header;
        });
    }
    calculateBudgetLines(techMap) {
        const fieldArea = techMap.field.area;
        const fieldUnit = 'ha'; // Assume Field.area is always HA in DB per policy
        const lines = [];
        for (const stage of techMap.stages) {
            for (const op of stage.operations) {
                for (const res of op.resources) {
                    // Normalize Norm (Resource amount) to base unit
                    const normalizedNorm = this.unitService.normalize(res.amount, res.unit);
                    // Normalize Area (redundant but safe)
                    const normalizedArea = this.unitService.normalize(fieldArea, fieldUnit);
                    // Formula: Norm * Area * Price (Norm is per Ha)
                    const quantity = normalizedNorm.value * normalizedArea.value;
                    const price = res.costPerUnit || 0;
                    const totalCost = quantity * price;
                    lines.push({
                        resourceId: res.id,
                        name: res.name,
                        category: this.mapResourceToCategory(res.type),
                        plannedNorm: normalizedNorm.value,
                        plannedPrice: price,
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
    /**
     * Deterministic hashing with stable key ordering.
     */
    calculateDerivationHash(mapId, version, lines) {
        // 1. Sort lines by resourceId (Stable)
        const sortedLines = [...lines].sort((a, b) => a.resourceId.localeCompare(b.resourceId));
        // 2. Build canonical payload (Fixed key order)
        const payload = {
            mapId: mapId,
            version: version,
            lines: sortedLines.map(l => ({
                id: l.resourceId,
                c: l.category,
                n: l.plannedNorm,
                p: l.plannedPrice,
                t: l.totalCost
            }))
        };
        return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    }
}
exports.BudgetGeneratorService = BudgetGeneratorService;
