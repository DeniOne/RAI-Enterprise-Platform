"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaborContractService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const hr_domain_event_service_1 = require("./hr-domain-event.service");
let LaborContractService = class LaborContractService {
    prisma;
    hrEventService;
    constructor(prisma, hrEventService) {
        this.prisma = prisma;
        this.hrEventService = hrEventService;
    }
    /**
     * Create labor contract
     */
    async create(personalFileId, data, actorId, actorRole) {
        // Check for existing ACTIVE contract
        const existingActive = await this.prisma.laborContract.findFirst({
            where: {
                personalFileId,
                status: 'ACTIVE',
            },
        });
        if (existingActive) {
            throw new common_1.BadRequestException('Employee already has an ACTIVE contract. Terminate existing contract first.');
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
    async createAmendment(contractId, changes, actorId, actorRole) {
        const contract = await this.prisma.laborContract.findUnique({
            where: { id: contractId },
        });
        if (!contract) {
            throw new common_1.NotFoundException(`LaborContract ${contractId} not found`);
        }
        if (contract.status !== 'ACTIVE') {
            throw new common_1.BadRequestException('Can only amend ACTIVE contracts');
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
    async terminate(id, reason, terminationDate, actorId, actorRole) {
        const contract = await this.prisma.laborContract.findUnique({
            where: { id },
        });
        if (!contract) {
            throw new common_1.NotFoundException(`LaborContract ${id} not found`);
        }
        if (contract.status !== 'ACTIVE') {
            throw new common_1.BadRequestException('Can only terminate ACTIVE contracts');
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
    async findExpiring(days = 30) {
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
    async generateContractNumber() {
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
};
exports.LaborContractService = LaborContractService;
exports.LaborContractService = LaborContractService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, hr_domain_event_service_1.HRDomainEventService])
], LaborContractService);
