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
exports.EmployeeHiredListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const personal_file_service_1 = require("../services/personal-file.service");
const prisma_service_1 = require("@/prisma/prisma.service");
/**
 * EmployeeHiredListener
 *
 * CRITICAL: Listens to employee.hired event (NOT employee.created)
 *
 * Reason: Employee ≠ Hired
 * - Employee can be created but not hired yet
 * - PersonalFile should only be created AFTER hire fact
 *
 * Idempotency: Checks if PersonalFile already exists before creating
 */
let EmployeeHiredListener = class EmployeeHiredListener {
    personalFileService;
    prisma;
    constructor(personalFileService, prisma) {
        this.personalFileService = personalFileService;
        this.prisma = prisma;
    }
    async handleEmployeeHired(payload) {
        // Idempotency check
        const existing = await this.prisma.personalFile.findUnique({
            where: { employeeId: payload.employeeId },
        });
        if (existing) {
            console.log(`[EmployeeHiredListener] PersonalFile already exists for employee ${payload.employeeId}`);
            return; // Already created
        }
        // Create PersonalFile AFTER hire fact
        await this.personalFileService.create(payload.employeeId, payload.hiredBy || 'SYSTEM', payload.hiredByRole || 'HR_MANAGER');
        console.log(`[EmployeeHiredListener] PersonalFile created for employee ${payload.employeeId}`);
    }
};
exports.EmployeeHiredListener = EmployeeHiredListener;
__decorate([
    (0, event_emitter_1.OnEvent)('employee.hired') // ✅ HIRED, not CREATED
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeeHiredListener.prototype, "handleEmployeeHired", null);
exports.EmployeeHiredListener = EmployeeHiredListener = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [personal_file_service_1.PersonalFileService, typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], EmployeeHiredListener);
