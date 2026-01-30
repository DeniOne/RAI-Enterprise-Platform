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
var EmployeeOnboardedListener_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeOnboardedListener = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const personal_file_service_1 = require("../services/personal-file.service");
const prisma_service_1 = require("@/prisma/prisma.service");
/**
 * EmployeeOnboardedListener
 *
 * CRITICAL: Listens to employee.onboarded event (initial activation event)
 *
 * Semantic Note:
 * - employee.onboarded = initial activation event
 * - NOT for: rehire, transfer, restoration
 * - PersonalFile should only be created AFTER onboarding fact
 *
 * Idempotency: Checks if PersonalFile already exists before creating
 */
let EmployeeOnboardedListener = EmployeeOnboardedListener_1 = class EmployeeOnboardedListener {
    personalFileService;
    prisma;
    logger = new common_1.Logger(EmployeeOnboardedListener_1.name);
    constructor(personalFileService, prisma) {
        this.personalFileService = personalFileService;
        this.prisma = prisma;
    }
    async handleEmployeeOnboarded(payload) {
        this.logger.log(`Handling employee.onboarded for employee ${payload.employeeId}`);
        // Idempotency check: prevent duplicate PersonalFile creation
        const existing = await this.prisma.personalFile.findUnique({
            where: { employeeId: payload.employeeId },
        });
        if (existing) {
            this.logger.warn(`PersonalFile already exists for employee ${payload.employeeId}`);
            return; // Already created
        }
        // Create PersonalFile AFTER onboarding fact
        await this.personalFileService.create(payload.employeeId, payload.onboardedBy || 'SYSTEM', payload.onboardedByRole || 'HR_MANAGER');
        this.logger.log(`PersonalFile created for employee ${payload.employeeId}`);
    }
};
exports.EmployeeOnboardedListener = EmployeeOnboardedListener;
__decorate([
    (0, event_emitter_1.OnEvent)('employee.onboarded') // ✅ ONBOARDED, not HIRED
    ,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmployeeOnboardedListener.prototype, "handleEmployeeOnboarded", null);
exports.EmployeeOnboardedListener = EmployeeOnboardedListener = EmployeeOnboardedListener_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [personal_file_service_1.PersonalFileService, typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object])
], EmployeeOnboardedListener);
