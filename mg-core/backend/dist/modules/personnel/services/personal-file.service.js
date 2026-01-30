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
exports.PersonalFileService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const hr_status_fsm_1 = require("../domain/hr-status-fsm");
const hr_domain_event_service_1 = require("./hr-domain-event.service");
const event_emitter_1 = require("@nestjs/event-emitter");
let PersonalFileService = class PersonalFileService {
    prisma;
    hrEventService;
    eventEmitter;
    constructor(prisma, hrEventService, eventEmitter) {
        this.prisma = prisma;
        this.hrEventService = hrEventService;
        this.eventEmitter = eventEmitter;
    }
    /**
     * Create PersonalFile (on employee hiring)
     */
    async create(employeeId, actorId, actorRole) {
        // Generate unique file number
        const fileNumber = await this.generateFileNumber();
        const personalFile = await this.prisma.personalFile.create({
            data: {
                employeeId,
                fileNumber,
                hrStatus: 'ONBOARDING',
            },
        });
        // Emit EMPLOYEE_HIRED event (FACT event, one-time only)
        await this.hrEventService.emit({
            eventType: 'EMPLOYEE_HIRED',
            aggregateType: 'PERSONAL_FILE',
            aggregateId: personalFile.id,
            actorId,
            actorRole,
            payload: {
                employeeId,
                fileNumber,
            },
            newState: { hrStatus: 'ONBOARDING' },
        });
        return personalFile;
    }
    /**
     * Update HR status with FSM validation
     * IMPORTANT: Emits STATE CHANGE events (NOT fact events like EMPLOYEE_HIRED)
     */
    async updateStatus(id, newStatus, actorId, actorRole, reason) {
        const personalFile = await this.prisma.personalFile.findUnique({
            where: { id },
        });
        if (!personalFile) {
            throw new common_1.NotFoundException(`PersonalFile ${id} not found`);
        }
        // CRITICAL: Validate FSM transition
        (0, hr_status_fsm_1.validateHRStatusTransition)(personalFile.hrStatus, newStatus);
        // Update status
        const updated = await this.prisma.personalFile.update({
            where: { id },
            data: {
                hrStatus: newStatus,
                ...(newStatus === 'TERMINATED' && { closedAt: new Date() }),
            },
        });
        // CRITICAL: Emit STATE CHANGE event (not FACT event)
        // EMPLOYEE_HIRED is emitted ONLY in create()
        // EMPLOYEE_DISMISSED is emitted ONLY when status → TERMINATED
        let eventType;
        if (newStatus === 'TERMINATED') {
            eventType = 'EMPLOYEE_DISMISSED'; // FACT: dismissal happened
        }
        else if (newStatus === 'ARCHIVED') {
            eventType = 'FILE_ARCHIVED'; // FACT: file archived
            // CRITICAL: Emit event for Module 29 (Library & Archive)
            // This triggers PersonnelArchivingListener in Module 29
            await this.emitArchivingEvent(id, personalFile);
        }
        else {
            // All other transitions = generic state change
            eventType = 'EMPLOYEE_TRANSFERRED'; // STATE CHANGE (generic)
        }
        await this.hrEventService.emit({
            eventType,
            aggregateType: 'PERSONAL_FILE',
            aggregateId: id,
            actorId,
            actorRole,
            payload: {
                from: personalFile.hrStatus,
                to: newStatus,
                reason,
            },
            previousState: { hrStatus: personalFile.hrStatus },
            newState: { hrStatus: newStatus },
        });
        return updated;
    }
    /**
     * Find PersonalFile by ID
     */
    async findById(id) {
        const personalFile = await this.prisma.personalFile.findUnique({
            where: { id },
            include: {
                employee: true,
                documents: true,
                orders: true,
                contracts: true,
            },
        });
        if (!personalFile) {
            throw new common_1.NotFoundException(`PersonalFile ${id} not found`);
        }
        return personalFile;
    }
    /**
     * Generate unique file number using DB sequence
     * CRITICAL: Race-condition safe (uses DB sequence, not count)
     */
    async generateFileNumber() {
        // Use DB sequence to avoid race conditions
        const year = new Date().getFullYear();
        // Get next sequence value from DB
        const result = await this.prisma.$queryRaw `
      SELECT nextval('personal_file_number_seq') as nextval
    `;
        const sequenceNumber = Number(result[0].nextval);
        return `PF-${year}-${String(sequenceNumber).padStart(5, '0')}`;
    }
    /**
     * Emit archiving event for Module 29 (Library & Archive)
     * CRITICAL: This triggers 75-year retention in Library
     */
    async emitArchivingEvent(personalFileId, personalFile) {
        // Fetch all documents for this PersonalFile
        const documents = await this.prisma.personnelDocument.findMany({
            where: { personalFileId },
        });
        // TODO: Fetch actual file buffers from storage
        // For now, emit event with document metadata
        this.eventEmitter.emit('personal_file.archived', {
            personalFileId,
            employeeId: personalFile.employeeId,
            fileNumber: personalFile.fileNumber,
            documents: documents.map(doc => ({
                id: doc.id,
                title: doc.title,
                file: Buffer.from(''), // TODO: Fetch from storage
                mimeType: 'application/pdf', // TODO: Get from document metadata
            })),
            retentionYears: 75, // HR documents = 75 years retention
        });
    }
};
exports.PersonalFileService = PersonalFileService;
exports.PersonalFileService = PersonalFileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof prisma_service_1.PrismaService !== "undefined" && prisma_service_1.PrismaService) === "function" ? _a : Object, hr_domain_event_service_1.HRDomainEventService,
        event_emitter_1.EventEmitter2])
], PersonalFileService);
