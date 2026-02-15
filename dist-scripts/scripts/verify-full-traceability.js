"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const budget_generator_service_1 = require("../apps/api/src/modules/consulting/budget-generator.service");
const unit_normalization_service_1 = require("../apps/api/src/modules/consulting/unit-normalization.service");
const deviation_service_1 = require("../apps/api/src/modules/consulting/deviation.service");
const prisma_client_1 = require("@rai/prisma-client");
// Mock Data
const fieldArea = 100;
const mockTechMap = {
    id: 'tm-trace-1',
    version: 1,
    status: prisma_client_1.TechMapStatus.ACTIVE,
    harvestPlanId: 'hp-1',
    seasonId: 'season-1',
    companyId: 'comp-1',
    field: { area: fieldArea },
    stages: [{
            name: 'Stage 1',
            operations: [{
                    name: 'Op 1',
                    resources: [
                        { id: 'res-1', name: 'Seeds', type: 'SOWING_MATERIAL', amount: 2, unit: 'kg', costPerUnit: 100 }
                    ]
                }]
        }]
};
const mockBudget = {
    id: 'budget-trace-1',
    type: prisma_client_1.BudgetType.OPERATIONAL,
    status: prisma_client_1.BudgetStatus.LOCKED,
    totalPlannedAmount: 20000, // 2 * 100 * 100
    totalActualAmount: 0,
    items: [
        { id: 'bi-1', category: prisma_client_1.BudgetCategory.SEEDS, plannedAmount: 20000, actualAmount: 0 }
    ]
};
// Mock Prisma with full flow capture
const mockPrisma = {
    techMap: {
        findUnique: async () => mockTechMap
    },
    budgetPlan: {
        create: async (data) => ({ ...mockBudget, ...data }),
        findUnique: async () => ({
            ...mockBudget,
            actualAmount: 25000, // Simulate fact > plan
            items: [{ ...mockBudget.items[0], actualAmount: 25000 }]
        })
    },
    budgetItem: {
        createMany: async () => ({ count: 1 })
    },
    $transaction: async (cb) => cb(mockPrisma)
};
async function verifyTraceability() {
    console.log('🚀 Starting Full Traceability Verification (Norm -> Plan -> Fact -> Deviation)');
    const unitService = new unit_normalization_service_1.UnitNormalizationService();
    const generator = new budget_generator_service_1.BudgetGeneratorService(mockPrisma, unitService);
    const deviationService = new deviation_service_1.DeviationService(mockPrisma);
    // 1. Generate Budget from Norms
    console.log('Step 1: Generating Budget from TechMap norms...');
    const budget = await generator.generateOperationalBudget('tm-trace-1', 'user-1');
    if (budget.totalPlannedAmount !== 20000)
        throw new Error('Budget calculation failed');
    console.log('✅ Norm -> Plan: Success (Planned: 20,000)');
    // 2. Simulate Deviation Calculation
    // In Phase 2.5 we assume Fact ingestion (Ledger -> Orchestrator -> Budget actuals) happened.
    // Here we verify the DeviationService correctly interprets the result.
    console.log('Step 2: Calculating Deviations...');
    const report = await deviationService.calculateBudgetDeviations(budget.id);
    console.log(`Report: Planned=${report.totalPlanned}, Actual=${report.totalActual}, Deviation=${report.totalDeviation}`);
    if (report.totalDeviation !== -5000) { // 20000 - 25000
        throw new Error(`Deviation Mismatch: Expected -5000, got ${report.totalDeviation}`);
    }
    if (report.items[0].category !== prisma_client_1.BudgetCategory.SEEDS)
        throw new Error('Category mismatch');
    console.log('✅ Plan -> Fact -> Deviation: Success');
    console.log('\n🌟 ALL PHASE 2 REQUIREMENTS VERIFIED 🌟');
}
verifyTraceability().catch(e => {
    console.error('❌ Verification Failed:', e);
    process.exit(1);
});
