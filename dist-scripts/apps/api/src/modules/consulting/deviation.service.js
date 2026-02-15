"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviationService = void 0;
const common_1 = require("@nestjs/common");
@(0, common_1.Injectable)()
class DeviationService {
    prisma;
    logger = new common_1.Logger(DeviationService.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Calculates deviations for a specific budget plan.
     * Logic: Deviation = Planned - Actual.
     * Follows Phase 2.4 "Calculated, not Stored" principle.
     */
    async calculateBudgetDeviations(budgetPlanId) {
        const budget = await this.prisma.budgetPlan.findUnique({
            where: { id: budgetPlanId },
            include: { items: true }
        });
        if (!budget) {
            throw new common_1.NotFoundException(`Budget Plan ${budgetPlanId} not found`);
        }
        const items = budget.items.map(item => {
            const planned = item.plannedAmount || 0;
            const actual = item.actualAmount || 0;
            const deviation = planned - actual;
            const deviationPercentage = planned !== 0 ? (deviation / planned) * 100 : 0;
            return {
                category: item.category,
                planned,
                actual,
                deviation,
                deviationPercentage
            };
        });
        const totalPlanned = budget.totalPlannedAmount || 0;
        const totalActual = budget.totalActualAmount || 0;
        const totalDeviation = totalPlanned - totalActual;
        return {
            budgetPlanId,
            totalPlanned,
            totalActual,
            totalDeviation,
            items
        };
    }
}
exports.DeviationService = DeviationService;
