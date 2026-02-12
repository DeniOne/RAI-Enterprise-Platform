import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { ConsultingOperationCompletedEvent } from "./events/consulting-operation-completed.event";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { BudgetPlanService } from "./budget-plan.service";
import { BudgetStatus, BudgetCategory } from "@rai/prisma-client";

@Injectable()
export class ConsultingOrchestrator {
    private readonly logger = new Logger(ConsultingOrchestrator.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly budgetService: BudgetPlanService,
    ) { }

    @OnEvent('consulting.operation.completed')
    async handleOperationCompleted(event: ConsultingOperationCompletedEvent) {
        this.logger.log(`[ORCHESTRATOR] Handling completion of operation ${event.operationId} in execution ${event.executionId}`);

        // 1. Создаем запись в логе (START)
        const orchestratorLog = await this.prisma.executionOrchestrationLog.create({
            data: {
                executionId: event.executionId,
                event: 'OperationCompleted',
                status: 'PROCESSING',
                metadata: { eventData: event as any }
            }
        });

        const outcome = {
            status: 'SUCCESS' as string,
            budgetApplied: false,
            deviationCreated: false,
            warnings: [] as string[],
            error: null as string | null
        };

        try {
            // 2. Находим активный бюджетный план
            const budgetPlan = await this.prisma.budgetPlan.findFirst({
                where: {
                    techMapSnapshotId: event.techMapId,
                    status: BudgetStatus.LOCKED
                },
                include: { items: true }
            });

            if (!budgetPlan) {
                const warn = `Нет активного LOCKED бюджета для техкарты ${event.techMapId}.`;
                this.logger.warn(`[ORCHESTRATOR] ${warn}`);
                outcome.status = 'WARNING';
                outcome.warnings.push(warn);
            } else {
                // 3. Атомарно связываем транзакции и обновляем бюджет
                await this.prisma.$transaction(async (tx) => {
                    // Линкуем транзакции к логу для Audit Trail
                    await tx.stockTransaction.updateMany({
                        where: { id: { in: event.stockTransactionIds } },
                        data: { orchLogId: orchestratorLog.id }
                    });

                    const transactions = await tx.stockTransaction.findMany({
                        where: { id: { in: event.stockTransactionIds } }
                    });

                    for (const transaction of transactions) {
                        const category = this.mapResourceToCategory((transaction as any).resourceType);
                        const budgetItem = budgetPlan.items.find(i => i.category === category);

                        if (budgetItem) {
                            await tx.budgetItem.update({
                                where: { id: budgetItem.id },
                                data: {
                                    actualAmount: { increment: (transaction as any).totalCost || 0 },
                                    stockTransactions: { connect: { id: transaction.id } }
                                }
                            });
                        } else {
                            outcome.warnings.push(`Категория ${category} не найдена в бюджете ${budgetPlan.id}`);
                        }
                    }
                });
                outcome.budgetApplied = true;

                // 4. Синхронизация бюджета и проверка на отклонения
                const syncResult = await this.budgetService.syncActuals(budgetPlan.id, {
                    userId: 'SYSTEM',
                    role: 'ADMIN' as any,
                    companyId: event.companyId
                });

                if ((syncResult as any)?.deviationCreated) {
                    outcome.deviationCreated = true;
                }
            }

        } catch (error) {
            outcome.status = 'FAILURE';
            outcome.error = error.message;
            this.logger.error(`[ORCHESTRATOR] Failure during processing execution ${event.executionId}: ${error.message}`, error.stack);
        } finally {
            // 5. Финализируем лог
            try {
                await this.prisma.executionOrchestrationLog.update({
                    where: { id: orchestratorLog.id },
                    data: {
                        status: outcome.status,
                        budgetApplied: outcome.budgetApplied,
                        deviationCreated: outcome.deviationCreated,
                        warnings: outcome.warnings,
                        error: outcome.error
                    }
                });
            } catch (logError) {
                this.logger.error(`[CRITICAL] Failed to finalize orchestration log: ${logError.message}`);
            }
        }
    }

    private mapResourceToCategory(type: string): BudgetCategory {
        const t = type.toUpperCase();
        if (t.includes('SEED')) return BudgetCategory.SEEDS;
        if (t.includes('FERT')) return BudgetCategory.FERTILIZER;
        if (t.includes('FUEL')) return BudgetCategory.FUEL;
        if (t.includes('LABOR')) return BudgetCategory.LABOR;
        if (t.includes('MACH')) return BudgetCategory.MACHINERY;
        return BudgetCategory.OTHER;
    }
}
