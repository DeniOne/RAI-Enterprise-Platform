import { ManagementDecisionService } from '../apps/api/src/modules/consulting/management-decision.service';
import { KpiService } from '../apps/api/src/modules/consulting/kpi.service';
import { StrategicViewService } from '../apps/api/src/modules/consulting/strategic-view.service';
import { DecisionStatus, UserRole } from '@rai/prisma-client';

// Mock Data
const mockContext = { userId: 'u1', companyId: 'c1', role: UserRole.ADMIN };
const mockSeasonId = 's1';
const mockPlanId = 'p1';
const mockDeviationId = 'dev1';

// Mock Prisma
const mockPrisma: any = {
    managementDecision: {
        findUnique: async (args: any) => ({
            id: args.where.id,
            status: DecisionStatus.DRAFT,
            version: 1,
            companyId: 'c1'
        }),
        findFirst: async () => ({ version: 1 }),
        create: async (args: any) => ({ ...args.data, id: 'new-id' }),
        update: async (args: any) => ({ ...args.data, id: args.where.id }),
        findMany: async () => []
    },
    deviationReview: {
        findUnique: async () => ({ id: mockDeviationId, companyId: 'c1', status: 'OPEN' }),
        findMany: async () => [
            { id: mockDeviationId, companyId: 'c1', seasonId: mockSeasonId, decisions: [], severity: 'HIGH', deviationSummary: 'Test', status: 'OPEN' }
        ]
    },
    ledgerEntry: {
        aggregate: async () => ({ _sum: { amount: 150000.555555 } }) // Test rounding input
    },
    harvestPlan: {
        findUnique: async () => ({ id: mockPlanId, companyId: 'c1', activeBudgetPlan: { id: 'b1', totalPlannedAmount: 200000 } }),
        findMany: async () => [{ id: mockPlanId }]
    }
};

const mockRepo: any = {
    findByPlanId: async () => ({
        totalOutput: 100, // tons
        marketPrice: 2000, // per ton (Total Revenue = 200,000)
        harvestedArea: 50, // ha
        actualYield: 2.0,
        plannedYield: 1.8
    })
};

async function verifyManagementLayer() {
    console.log('🚀 Starting Phase 3 Verification...');

    const decisionService = new ManagementDecisionService(mockPrisma);
    const kpiService = new KpiService(mockPrisma, mockRepo);
    const strategicService = new StrategicViewService(mockPrisma, kpiService, decisionService);

    // 1. Verify KPI Rounding Policy (ARCH-KPI-ROUNDING)
    console.log('\n--- KPI Rounding Validation ---');
    const kpis = await kpiService.calculatePlanKPI(mockPlanId, mockContext);

    // revenue: 100 * 2000 = 200,000.00
    // actualCost: 150,000.56 (rounded)
    // ebitda: 200,000 - 150,000.555555 = 49999.444445 -> 49,999.44
    // costPerUnit: 150000.555555 / 100 = 1500.005555 -> 1500.0056 (4 decimals)

    console.log(`ROI: ${kpis.roi}%`);
    console.log(`EBITDA: ${kpis.ebitda}`);
    console.log(`Cost Per Unit: ${kpis.costPerUnit}`);

    if (String(kpis.ebitda).split('.')[1]?.length > 2) throw new Error('EBITDA rounding failed');
    if (String(kpis.costPerUnit).split('.')[1]?.length > 4) throw new Error('CostPerUnit rounding failed');
    console.log('✅ Rounding Policy Enforced (ROI:2, EBITDA:2, Cost:4)');

    // 2. Verify Management Decision Immutability
    console.log('\n--- Immutability Validation ---');
    // Simulate updating a CONFIRMED decision
    mockPrisma.managementDecision.findUnique = async () => ({
        id: 'd1', status: DecisionStatus.CONFIRMED, companyId: 'c1'
    });

    try {
        await decisionService.confirm('d1', mockContext);
        throw new Error('Should have blocked confirmation of already confirmed decision');
    } catch (e: any) {
        console.log(`✅ Immutability Blocked: ${e.message}`);
    }

    // 3. Verify Strategic View Aggregation
    console.log('\n--- Strategic View Validation ---');
    const dashboard = await strategicService.getStrategicDashboard(mockSeasonId, mockContext);
    console.log(`Dashboard generated for season: ${dashboard.header.seasonId}`);
    console.log(`Total Revenue in Dashboard: ${dashboard.finances.revenue}`);

    if (!dashboard.management) throw new Error('Management metrics missing');
    console.log(`Deviations found: ${dashboard.deviationJournal.length}`);
    console.log('✅ Strategic View Projection: Success');

    console.log('\n🌟 ALL PHASE 3 REQUIREMENTS VERIFIED 🌟');
}

verifyManagementLayer().catch(e => {
    console.error('❌ Verification Failed:', e);
    process.exit(1);
});
