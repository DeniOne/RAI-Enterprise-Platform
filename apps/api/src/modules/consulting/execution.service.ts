import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { ExecutionStatus } from "@rai/prisma-client";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CompleteOperationDto } from "./dto/complete-operation.dto";
import { ConsultingOperationCompletedEvent } from "./events/consulting-operation-completed.event";

export interface ExecutionContext {
    userId: string;
    companyId: string;
}

@Injectable()
export class ExecutionService {
    private readonly logger = new Logger(ExecutionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    /**
     * Инициализирует запись об исполнении для операции, если её ещё нет.
     */
    async getOrCreateExecution(operationId: string, context: ExecutionContext) {
        const operation = await this.prisma.mapOperation.findUnique({
            where: { id: operationId },
            include: { mapStage: { include: { techMap: true } } }
        });

        if (!operation || operation.mapStage.techMap.companyId !== context.companyId) {
            throw new NotFoundException('Операция техкарты не найдена');
        }

        let execution = await this.prisma.executionRecord.findUnique({
            where: { operationId }
        });

        if (!execution) {
            execution = await this.prisma.executionRecord.create({
                data: {
                    operationId,
                    status: ExecutionStatus.PLANNED,
                    companyId: context.companyId,
                    plannedDate: operation.plannedStartTime,
                }
            });
        }

        return execution;
    }

    /**
     * Переводит операцию в статус IN_PROGRESS.
     */
    async startOperation(operationId: string, context: ExecutionContext) {
        const execution = await this.getOrCreateExecution(operationId, context);

        if (execution.status !== ExecutionStatus.PLANNED) {
            throw new BadRequestException(`Нельзя начать операцию в статусе ${execution.status}`);
        }

        return this.prisma.executionRecord.update({
            where: { id: execution.id },
            data: {
                status: ExecutionStatus.IN_PROGRESS,
                actualDate: new Date(),
                version: { increment: 1 }
            }
        });
    }

    /**
     * Завершает операцию, фиксирует списание ресурсов и публикует событие.
     */
    async completeOperation(dto: CompleteOperationDto, context: ExecutionContext) {
        const execution = await this.getOrCreateExecution(dto.operationId, context);

        if (execution.status !== ExecutionStatus.IN_PROGRESS) {
            throw new BadRequestException('Завершить можно только операцию в статусе IN_PROGRESS');
        }

        // Атомарная транзакция: Обновление статуса + Списание + Публикация
        const result = await this.prisma.$transaction(async (tx) => {
            // 1. Обновляем статус исполнения (Optimistic Locking)
            const updatedExecution = await tx.executionRecord.update({
                where: { id: execution.id, version: execution.version },
                data: {
                    status: ExecutionStatus.DONE,
                    actualDate: new Date(),
                    notes: dto.notes,
                    performedById: context.userId,
                    version: { increment: 1 }
                },
                include: { operation: { include: { mapStage: { include: { techMap: true } } } } }
            });

            // 2. Создаем записи StockTransaction (списания)
            const stockTransactions = [];
            for (const resEntry of dto.actualResources) {
                const mapResource = await tx.mapResource.findUnique({
                    where: { id: resEntry.resourceId }
                });

                if (!mapResource || mapResource.mapOperationId !== dto.operationId) {
                    throw new BadRequestException(`Ресурс ${resEntry.resourceId} не принадлежит данной операции`);
                }

                // Поиск или создание StockItem (заглушка для ассет-реджистри)
                let stockItem = await tx.stockItem.findFirst({
                    where: { companyId: context.companyId, name: mapResource.name }
                });

                if (!stockItem) {
                    stockItem = await tx.stockItem.create({
                        data: {
                            name: mapResource.name,
                            type: 'OTHER' as any, // fallback
                            companyId: context.companyId,
                            accountId: (await tx.account.findFirst({ where: { companyId: context.companyId } })).id,
                            unit: mapResource.unit,
                        }
                    });
                }

                const transaction = await tx.stockTransaction.create({
                    data: {
                        executionId: updatedExecution.id,
                        itemId: stockItem.id,
                        type: 'CONSUMPTION', // Assuming 'CONSUMPTION' is a valid string literal for type
                        amount: resEntry.amount,
                        resourceType: mapResource.type,
                        resourceName: mapResource.name,
                        unit: mapResource.unit,
                        costPerUnit: mapResource.costPerUnit,
                        totalCost: (mapResource.costPerUnit || 0) * resEntry.amount,
                        companyId: context.companyId,
                        userId: context.userId,
                    }
                });
                stockTransactions.push(transaction);
            }

            return { updatedExecution, stockTransactions };
        });

        // 3. Публикуем событие
        this.eventEmitter.emit(
            'consulting.operation.completed',
            new ConsultingOperationCompletedEvent(
                result.updatedExecution.id,
                dto.operationId,
                result.updatedExecution.operation.mapStage.techMapId,
                result.stockTransactions.map(t => t.id),
                context.companyId
            )
        );

        return result;
    }

    /**
     * Получает список всех активных операций для операционного дашборда.
     */
    async getActiveOperations(context: ExecutionContext) {
        return this.prisma.mapOperation.findMany({
            where: {
                mapStage: {
                    techMap: {
                        harvestPlan: {
                            companyId: context.companyId,
                            status: { in: ['ACTIVE', 'APPROVED'] }
                        }
                    }
                }
            },
            include: {
                resources: true,
                executionRecord: true,
                mapStage: {
                    include: {
                        techMap: {
                            include: {
                                harvestPlan: {
                                    include: { account: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { plannedStartTime: 'asc' }
        });
    }
}
