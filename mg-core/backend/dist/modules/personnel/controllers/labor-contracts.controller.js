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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaborContractsController = void 0;
const common_1 = require("@nestjs/common");
const labor_contract_service_1 = require("../services/labor-contract.service");
const request_1 = require("../dto/request");
const guards_1 = require("../guards");
const prisma_service_1 = require("@/prisma/prisma.service");
let LaborContractsController = class LaborContractsController {
    contractService;
    prisma;
    constructor(contractService, prisma) {
        this.contractService = contractService;
        this.prisma = prisma;
    }
    /**
     * GET /api/personnel/contracts
     * Список контрактов
     * RBAC: HR_SPECIALIST+
     */
    async findAll(status, contractType, personalFileId) {
        const where = {};
        if (status) {
            where.status = status;
        }
        if (contractType) {
            where.contractType = contractType;
        }
        if (personalFileId) {
            where.personalFileId = personalFileId;
        }
        const contracts = await this.prisma.laborContract.findMany({
            where,
            include: {
                personalFile: {
                    include: {
                        employee: true,
                    },
                },
                amendments: true,
            },
            orderBy: {
                contractDate: 'desc',
            },
        });
        return contracts;
    }
    /**
     * GET /api/personnel/contracts/expiring
     * Истекающие срочные договоры
     * RBAC: HR_MANAGER+
     */
    async findExpiring(days) {
        const contracts = await this.contractService.findExpiring(days || 30);
        return contracts;
    }
    /**
     * GET /api/personnel/contracts/:id
     * Детали контракта
     * RBAC: HR_SPECIALIST+
     */
    async findById(id) {
        // TODO: Implement findById in service
        throw new Error('Not implemented');
    }
    /**
     * POST /api/personnel/contracts
     * Создание трудового договора
     * RBAC: HR_MANAGER+
     */
    async create(dto, req) {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_MANAGER';
        const contract = await this.contractService.create(dto.personalFileId, {
            contractType: dto.contractType,
            contractDate: new Date(dto.contractDate),
            startDate: new Date(dto.startDate),
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            positionId: dto.positionId,
            departmentId: dto.departmentId,
            salary: dto.salary,
            salaryType: dto.salaryType,
            workSchedule: dto.workSchedule,
            probationDays: dto.probationDays,
        }, actorId, actorRole);
        return contract;
    }
    /**
     * POST /api/personnel/contracts/:id/amendments
     * Создание дополнительного соглашения
     * RBAC: HR_MANAGER+
     */
    async createAmendment(id, dto, req) {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_MANAGER';
        const amendment = await this.contractService.createAmendment(id, dto.changes, actorId, actorRole);
        return amendment;
    }
    /**
     * POST /api/personnel/contracts/:id/terminate
     * Расторжение трудового договора
     * CRITICAL: DIRECTOR ONLY!
     * RBAC: DIRECTOR
     */
    async terminate(id, dto, req) {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'UNKNOWN';
        // CRITICAL: Validate DIRECTOR role
        // This will be enforced by HRDomainEventService.emit()
        // which validates role permissions for CONTRACT_TERMINATED event
        const contract = await this.contractService.terminate(id, dto.reason, new Date(dto.terminationDate), actorId, actorRole);
        return contract;
    }
};
exports.LaborContractsController = LaborContractsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('contractType')),
    __param(2, (0, common_1.Query)('personalFileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], LaborContractsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('expiring'),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], LaborContractsController.prototype, "findExpiring", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LaborContractsController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.CreateContractDto, Object]),
    __metadata("design:returntype", Promise)
], LaborContractsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/amendments'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, request_1.CreateAmendmentDto, Object]),
    __metadata("design:returntype", Promise)
], LaborContractsController.prototype, "createAmendment", null);
__decorate([
    (0, common_1.Post)(':id/terminate'),
    (0, common_1.UseGuards)(guards_1.RequireDirectorGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, request_1.TerminateContractDto, Object]),
    __metadata("design:returntype", Promise)
], LaborContractsController.prototype, "terminate", null);
exports.LaborContractsController = LaborContractsController = __decorate([
    (0, common_1.Controller)('api/personnel/contracts'),
    (0, common_1.UseGuards)(guards_1.PersonnelAccessGuard),
    __metadata("design:paramtypes", [labor_contract_service_1.LaborContractService, typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], LaborContractsController);
