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
exports.EmployeeBeforeDeleteListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("@/prisma/prisma.service");
/**
 * EmployeeBeforeDeleteListener
 *
 * CRITICAL: Prevents employee deletion if PersonalFile exists
 *
 * Reason: PersonalFile contains juridical documents that must be archived first
 *
 * Suggestion: Archive PersonalFile before deleting employee
 */
let EmployeeBeforeDeleteListener = class EmployeeBeforeDeleteListener {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handleEmployeeBeforeDelete(payload) {
        const personalFile = await this.prisma.personalFile.findUnique({
            where: { employeeId: payload.employeeId },
        });
        if (personalFile) {
            throw new common_1.ForbiddenException({
                message: 'Cannot delete employee with existing PersonalFile',
                suggestion: 'Archive PersonalFile first',
                personalFileId: personalFile.id,
                personalFileStatus: personalFile.hrStatus,
            });
        }
    }
};
exports.EmployeeBeforeDeleteListener = EmployeeBeforeDeleteListener;
__decorate([
    (0, event_emitter_1.OnEvent)('employee.before_delete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeeBeforeDeleteListener.prototype, "handleEmployeeBeforeDelete", null);
exports.EmployeeBeforeDeleteListener = EmployeeBeforeDeleteListener = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], EmployeeBeforeDeleteListener);
