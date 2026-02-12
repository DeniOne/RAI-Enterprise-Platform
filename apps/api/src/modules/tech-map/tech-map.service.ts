import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TechMapStatus, HarvestPlanStatus, UserRole, TechMap } from '@rai/prisma-client';
import { IntegrityGateService } from '../integrity/integrity-gate.service';
import { TechMapStateMachine } from './fsm/tech-map.fsm';
import { TechMapActiveConflictError } from './tech-map.errors';

@Injectable()
export class TechMapService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly integrityGate: IntegrityGateService,
        private readonly fsm: TechMapStateMachine,
    ) { }

    async generateMap(harvestPlanId: string, seasonId: string) {
        const plan = await this.prisma.harvestPlan.findUnique({
            where: { id: harvestPlanId },
            include: {
                company: true
            }
        });

        const season = await this.prisma.season.findUnique({
            where: { id: seasonId },
            include: { rapeseed: true }
        });

        if (!plan || !season) {
            throw new NotFoundException('Harvest Plan or Season not found');
        }

        // Get max version for this context
        const lastMap = await this.prisma.techMap.findFirst({
            where: {
                fieldId: season.fieldId,
                crop: season.rapeseed.name,
                seasonId,
                companyId: plan.companyId
            },
            orderBy: { version: 'desc' }
        });

        const nextVersion = lastMap ? lastMap.version + 1 : 1;

        return this.prisma.techMap.create({
            data: {
                seasonId,
                harvestPlanId: plan.id,
                companyId: plan.companyId,
                fieldId: season.fieldId,
                crop: season.rapeseed.name,
                status: TechMapStatus.DRAFT,
                version: nextVersion,
            },
        });
    }

    async transitionStatus(
        id: string,
        targetStatus: TechMapStatus,
        companyId: string,
        userRole: UserRole,
        userId: string
    ) {
        return this.prisma.$transaction(async (tx) => {
            const map = await tx.techMap.findFirst({
                where: { id, companyId },
                include: {
                    stages: {
                        include: {
                            operations: {
                                include: {
                                    resources: true
                                }
                            }
                        }
                    }
                }
            });

            if (!map) {
                throw new NotFoundException('TechMap not found');
            }

            const current = map.status;

            // FSM Validation
            this.fsm.validate({
                currentStatus: current,
                targetStatus,
                userRole,
                userId
            });

            // Integrity Gate & Snapshots for Active Transition
            let data: any = { status: targetStatus };

            if (targetStatus === TechMapStatus.ACTIVE) {
                await this.integrityGate.validateTechMapAdmission(map.id);

                data.approvedAt = new Date();
                data.operationsSnapshot = map.stages; // Simplified snapshotting
                data.resourceNormsSnapshot = map.stages.flatMap(s => s.operations.flatMap(o => o.resources));

                // Atomic link to HarvestPlan
                await tx.harvestPlan.update({
                    where: { id: map.harvestPlanId },
                    data: { activeTechMapId: map.id }
                });
            }

            // Cleanup link on ARCHIVED if it was ACTIVE
            if (targetStatus === TechMapStatus.ARCHIVED && current === TechMapStatus.ACTIVE) {
                await tx.harvestPlan.update({
                    where: { id: map.harvestPlanId },
                    data: { activeTechMapId: null }
                });
            }

            try {
                return await tx.techMap.update({
                    where: { id },
                    data,
                });
            } catch (error: any) {
                // Catch P2002 for the Partial Index "unique_active_techmap"
                if (error.code === 'P2002') {
                    throw new TechMapActiveConflictError(`${map.fieldId}, ${map.crop}, ${map.seasonId}`);
                }
                throw error;
            }
        });
    }

    async updateDraft(id: string, data: any, companyId: string) {
        const map = await this.prisma.techMap.findFirst({
            where: { id, companyId },
        });

        if (!map) {
            throw new NotFoundException('TechMap not found');
        }

        if (map.status !== TechMapStatus.DRAFT && map.status !== TechMapStatus.REVIEW) {
            throw new ForbiddenException(`Cannot edit TechMap in state ${map.status}`);
        }

        return this.prisma.techMap.update({
            where: { id },
            data,
        });
    }

    async findOne(id: string, companyId: string) {
        const map = await this.prisma.techMap.findFirst({
            where: {
                id,
                companyId,
            },
            include: {
                stages: {
                    orderBy: { sequence: 'asc' },
                    include: {
                        operations: {
                            include: {
                                resources: true,
                            },
                        },
                    },
                },
            },
        });

        if (!map) {
            throw new NotFoundException('TechMap not found');
        }

        return map;
    }

    async findBySeason(seasonId: string, companyId: string) {
        const map = await this.prisma.techMap.findFirst({
            where: {
                seasonId,
                companyId,
            },
            include: {
                stages: {
                    orderBy: { sequence: 'asc' },
                    include: {
                        operations: {
                            include: {
                                resources: true,
                            },
                        },
                    },
                },
            },
        });

        if (!map) {
            throw new NotFoundException('TechMap for this season not found');
        }

        return map;
    }
}
