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
exports.PersonnelFilesController = void 0;
const common_1 = require("@nestjs/common");
const personal_file_service_1 = require("../services/personal-file.service");
const request_1 = require("../dto/request");
const guards_1 = require("../guards");
const prisma_service_1 = require("@/prisma/prisma.service");
let PersonnelFilesController = class PersonnelFilesController {
    personalFileService;
    prisma;
    constructor(personalFileService, prisma) {
        this.personalFileService = personalFileService;
        this.prisma = prisma;
    }
    /**
     * GET /api/personnel/files
     * Список личных дел
     * RBAC: HR_SPECIALIST+
     */
    async findAll(status, departmentId, employeeId) {
        // Build filter object
        const where = {};
        if (status) {
            where.hrStatus = status;
        }
        if (employeeId) {
            where.employeeId = employeeId;
        }
        // TODO: Add department filtering when employee.departmentId is available
        // if (departmentId) {
        //   where.employee = { departmentId };
        // }
        const files = await this.prisma.personalFile.findMany({
            where,
            include: {
                employee: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return files;
    }
    /**
     * GET /api/personnel/files/:id
     * Детали личного дела
     * RBAC: HR_SPECIALIST+
     */
    async findById(id) {
        const file = await this.personalFileService.findById(id);
        return file;
    }
    /**
     * POST /api/personnel/files
     * Создание личного дела
     * RBAC: HR_MANAGER+
     */
    async create(dto, req) {
        // Extract actor info from request (from auth middleware)
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_MANAGER';
        const file = await this.personalFileService.create(dto.employeeId, actorId, actorRole);
        return file;
    }
    /**
     * PATCH /api/personnel/files/:id/status
     * Обновление статуса личного дела
     * RBAC: HR_MANAGER+
     */
    async updateStatus(id, dto, req) {
        const actorId = req.user?.id || 'system';
        const actorRole = req.user?.role || 'HR_MANAGER';
        const file = await this.personalFileService.updateStatus(id, dto.newStatus, actorId, actorRole, dto.reason);
        return file;
    }
    /**
     * POST /api/personnel/files/:id/archive
     * Передача личного дела в архив (Module 29)
     * RBAC: HR_MANAGER+
     */
    async archive(id) {
        // TODO: Implement archive integration with Module 29
        throw new Error('Not implemented - requires Module 29 integration');
    }
};
exports.PersonnelFilesController = PersonnelFilesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('departmentId')),
    __param(2, (0, common_1.Query)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], PersonnelFilesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PersonnelFilesController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_1.CreatePersonalFileDto, Object]),
    __metadata("design:returntype", Promise)
], PersonnelFilesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, request_1.UpdateStatusDto, Object]),
    __metadata("design:returntype", Promise)
], PersonnelFilesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/archive'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PersonnelFilesController.prototype, "archive", null);
exports.PersonnelFilesController = PersonnelFilesController = __decorate([
    (0, common_1.Controller)('api/personnel/files'),
    (0, common_1.UseGuards)(guards_1.PersonnelAccessGuard),
    __metadata("design:paramtypes", [personal_file_service_1.PersonalFileService, typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], PersonnelFilesController);
