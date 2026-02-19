import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { ModelRegistryService } from './model-registry.service';

export enum ApprovalAction {
    APPROVE = 'APPROVE',
    REJECT = 'REJECT',
    REQUEST_CHANGES = 'REQUEST_CHANGES',
}

@Injectable()
export class GovernanceService {
    private readonly logger = new Logger(GovernanceService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly modelRegistry: ModelRegistryService,
    ) { }

    /**
     * Запрос на продвижение модели (например, из SHADOW в CANARY).
     */
    async submitForApproval(modelId: string, requesterId: string, notes?: string) {
        const model = await this.prisma.modelVersion.findUnique({ where: { id: modelId } });
        if (!model) throw new BadRequestException('Model not found');

        return this.prisma.approvalRequest.create({
            data: {
                modelId,
                requesterId,
                status: 'PENDING',
                notes,
                metadata: {
                    currentStatus: model.status,
                    modelName: model.name,
                    modelHash: model.hash
                }
            }
        });
    }

    /**
     * Официальное решение комитета/агронома.
     */
    async reviewModel(requestId: string, reviewerId: string, action: ApprovalAction, comment: string) {
        const request = await this.prisma.approvalRequest.findUnique({
            where: { id: requestId },
            include: { model: true }
        });

        if (!request || request.status !== 'PENDING') {
            throw new BadRequestException('Invalid or already processed request');
        }

        const newStatus = action === ApprovalAction.APPROVE ? 'APPROVED' : 'REJECTED';

        const updatedRequest = await this.prisma.approvalRequest.update({
            where: { id: requestId },
            data: {
                status: newStatus,
                reviewerId,
                reviewComment: comment,
                reviewedAt: new Date(),
            }
        });

        if (action === ApprovalAction.APPROVE) {
            this.logger.log(`⚖️ Model ${request.modelId} APPROVED by ${reviewerId}. Advancing FSM.`);

            // Продвигаем модель в CANARY
            await this.prisma.modelVersion.update({
                where: { id: request.modelId },
                data: { status: 'CANARY' }
            });

            // Логируем в Audit Trail
            await this.prisma.auditLog.create({
                data: {
                    action: 'COMMITTEE_APPROVAL',
                    companyId: request.model.companyId,
                    userId: reviewerId,
                    metadata: {
                        modelId: request.modelId,
                        requestId: updatedRequest.id,
                        comment
                    }
                }
            });
        }

        return updatedRequest;
    }
}
