import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TechMapStatus, HarvestPlanStatus } from '@rai/prisma-client';
import { IntegrityGateService } from '../integrity/integrity-gate.service';

@Injectable()
export class TechMapService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly integrityGate: IntegrityGateService,
    ) { }

    async generateMap(harvestPlanId: string, seasonId: string) {
        const plan = await this.prisma.harvestPlan.findUnique({
            where: { id: harvestPlanId },
        });

        if (!plan) {
            throw new NotFoundException('Harvest Plan not found');
        }

        // TechMap is only allowed to be created if HarvestPlan is APPROVED or DRAFT (for planning)
        // But per FSM_RBAC, it's usually derived from a plan.

        return this.prisma.techMap.upsert({
            where: { seasonId },
            update: {
                status: TechMapStatus.PROJECT,
                harvestPlanId: plan.id,
            },
            create: {
                seasonId,
                harvestPlanId: plan.id,
                companyId: plan.companyId,
                status: TechMapStatus.PROJECT,
                version: 1,
            },
        });
    }

    async transitionStatus(id: string, targetStatus: TechMapStatus, companyId: string) {
        const map = await this.prisma.techMap.findFirst({
            where: { id, companyId },
        });

        if (!map) {
            throw new NotFoundException('TechMap not found');
        }

        const current = map.status;

        // FSM Guards
        if (current === TechMapStatus.PROJECT && targetStatus === TechMapStatus.CHECKING) {
            // OK
        } else if (current === TechMapStatus.CHECKING && targetStatus === TechMapStatus.ACTIVE) {
            // Integrity Gate Check before activation
            await this.integrityGate.validateTechMapAdmission(map.id);
            // TODO: In real system, trigger snapshotting here
        } else if (current === TechMapStatus.ACTIVE && targetStatus === TechMapStatus.FROZEN) {
            // Lock forever
        } else {
            throw new BadRequestException(`Illegal transition from ${current} to ${targetStatus}`);
        }

        return this.prisma.techMap.update({
            where: { id },
            data: { status: targetStatus },
        });
    }

    async updateDraft(id: string, data: any, companyId: string) {
        const map = await this.prisma.techMap.findFirst({
            where: { id, companyId },
        });

        if (!map) {
            throw new NotFoundException('TechMap not found');
        }

        if (map.status !== TechMapStatus.PROJECT && map.status !== TechMapStatus.CHECKING) {
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
