"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonnelModule = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("@/prisma/prisma.service");
// Services
const services_1 = require("./services");
// Controllers
const controllers_1 = require("./controllers");
// Guards
const guards_1 = require("./guards");
// Listeners
const listeners_1 = require("./listeners");
let PersonnelModule = class PersonnelModule {
};
exports.PersonnelModule = PersonnelModule;
exports.PersonnelModule = PersonnelModule = __decorate([
    (0, common_1.Module)({
        imports: [event_emitter_1.EventEmitterModule.forRoot()],
        controllers: [
            controllers_1.PersonnelFilesController,
            controllers_1.PersonnelOrdersController,
            controllers_1.LaborContractsController,
            controllers_1.PersonnelDocumentsController,
        ],
        providers: [
            prisma_service_1.PrismaService,
            // Services
            services_1.HRDomainEventService,
            services_1.PersonalFileService,
            services_1.PersonnelOrderService,
            services_1.LaborContractService,
            services_1.PersonnelDocumentService,
            services_1.ArchiveIntegrationService,
            services_1.DocumentDeletionService,
            // Guards
            guards_1.PersonnelAccessGuard,
            guards_1.RequireDirectorGuard,
            // Listeners
            listeners_1.EmployeeOnboardedListener,
            listeners_1.EmployeeBeforeDeleteListener,
            listeners_1.LibraryArchivingCompletedListener,
            listeners_1.LibraryArchivingFailedListener,
            listeners_1.LegalDecisionListener,
        ],
        exports: [
            // Export services for use in other modules
            services_1.PersonalFileService,
            services_1.PersonnelOrderService,
            services_1.LaborContractService,
            services_1.PersonnelDocumentService,
            services_1.HRDomainEventService,
            services_1.ArchiveIntegrationService,
            services_1.DocumentDeletionService,
        ],
    })
], PersonnelModule);
