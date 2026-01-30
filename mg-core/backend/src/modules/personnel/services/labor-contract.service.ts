import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ContractStatus, ContractType } from '@prisma/client';
import { HRDomainEventService } from './hr-domain-event.service';

@Injectable()
export class LaborContractService {
    constructor(
        private prisma: PrismaService,
        private hrEventService: HRDomainEventService
    ) { }

    /**
     * Create labor contract
     */
    async create(
        personalFileId: string,
        data: {
            contractType: ContractType;
            contractDate: Date;
            startDate: Date;
            endDate?: Date;
            positionId: string;
            departmentId: string;
            salary: number;
            salaryType?: any;
            workSchedule: string;
            probationDays?: number;
        },
        actorId: string,
        actorRole: string
    ) {
        // Check for existing ACTIVE contract
        const existingActive = await this.prisma.laborContract.findFirst({
            where: {
                personalFileId,
                status: 'ACTIVE',
            },
        });

        if (existingActive) {
            throw new BadRequestException(
                'Employee already has an ACTIVE contract. Terminate existing contract first.'
            );
        }

        // Generate contract number
        const contractNumber = await this.generateContractNumber();

        const contract = await this.prisma.laborContract.create({
            data: {
                personalFileId,
                contractNumber,
                contractType: data.contractType,
                contractDate: data.contractDate,
                startDate: data.startDate,
                endDate: data.endDate,
                positionId: data.positionId,
                departmentId: data.departmentId,
                salary: data.salary,
                salaryType: data.salaryType || 'MONTHLY',
                workSchedule: data.workSchedule,
                probationDays: data.probationDays || 0,
                status: 'ACTIVE',
            },
        });

        // Emit CONTRACT_SIGNED event (FACT event)
        await this.hrEventService.emit({
            eventType: 'CONTRACT_SIGNED',
            aggregateType: 'LABOR_CONTRACT',
            aggregateId: contract.id,
            actorId,
            actorRole,
            payload: {
                contractNumber,
                contractType: data.contractType,
                personalFileId,
                salary: data.salary,
            },
            newState: { status: 'ACTIVE' },
            legalBasis: `Labor contract signed on ${data.contractDate.toISOString()}`,
        });

        return contract;
    }

    /**
     * Create contract amendment
     */
    async createAmendment(
        contractId: string,
        changes: any,
        actorId: string,
        actorRole: string
    ) {
        const contract = await this.prisma.laborContract.findUnique({
            where: { id: contractId },
        });

        if (!contract) {
            throw new NotFoundException(`LaborContract ${contractId} not found`);
        }

        if (contract.status !== 'ACTIVE') {
            throw new BadRequestException('Can only amend ACTIVE contracts');
        }

        // Get next amendment number
        const existingAmendments = await this.prisma.contractAmendment.count({
            where: { contractId },
        });

        const amendment = await this.prisma.contractAmendment.create({
            data: {
                contractId,
                amendmentNumber: existingAmendments + 1,
                amendmentDate: new Date(),
                effectiveDate: changes.effectiveDate || new Date(),
                changes,
            },
        });

        // Emit CONTRACT_AMENDED event
        await this.hrEventService.emit({
            eventType: 'CONTRACT_AMENDED',
            aggregateType: 'LABOR_CONTRACT',
            aggregateId: contractId,
            actorId,
            actorRole,
            payload: {
                amendmentNumber: amendment.amendmentNumber,
                changes,
            },
            legalBasis: `Contract amendment #${amendment.amendmentNumber}`,
        });

        return amendment;
    }

    /**
     * Terminate contract (DIRECTOR only!)
     */
    async terminate(
        id: string,
        reason: string,
        terminationDate: Date,
        actorId: string,
        actorRole: string
    ) {
        const contract = await this.prisma.laborContract.findUnique({
            where: { id },
        });

        if (!contract) {
            throw new NotFoundException(`LaborContract ${id} not found`);
        }

        if (contract.status !== 'ACTIVE') {
            throw new BadRequestException('Can only terminate ACTIVE contracts');
        }

        const terminated = await this.prisma.laborContract.update({
            where: { id },
            data: {
                status: 'TERMINATED',
                terminationDate,
                terminationReason: reason,
            },
        });

        // Emit CONTRACT_TERMINATED event (CRITICAL: validates DIRECTOR role)
        await this.hrEventService.emit({
            eventType: 'CONTRACT_TERMINATED',
            aggregateType: 'LABOR_CONTRACT',
            aggregateId: id,
            actorId,
            actorRole, // Will throw if not DIRECTOR
            payload: {
                contractNumber: contract.contractNumber,
                reason,
                terminationDate: terminationDate.toISOString(),
            },
            previousState: { status: 'ACTIVE' },
            newState: { status: 'TERMINATED' },
            legalBasis: `Contract terminated: ${reason}`,
        });

        return terminated;
    }

    /**
     * Find expiring fixed-term contracts
     */
    async findExpiring(days: number = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        return this.prisma.laborContract.findMany({
            where: {
                contractType: 'FIXED_TERM',
                status: 'ACTIVE',
                endDate: {
                    lte: futureDate,
                    gte: new Date(),
                },
            },
            include: {
                personalFile: {
                    include: {
                        employee: true,
                    },
                },
            },
        });
    }

    /**
     * Generate unique contract number
     */
    private async generateContractNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.prisma.laborContract.count({
            where: {
                contractDate: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${year + 1}-01-01`),
                },
            },
        });

        return `LC-${year}-${String(count + 1).padStart(5, '0')}`;
    }
}
