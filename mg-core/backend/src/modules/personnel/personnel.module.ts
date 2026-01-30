import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaService } from '@/prisma/prisma.service';

// Services
import {
    HRDomainEventService,
    PersonalFileService,
    PersonnelOrderService,
    LaborContractService,
    PersonnelDocumentService,
    ArchiveIntegrationService,
    DocumentDeletionService,
} from './services';

// Controllers
import {
    PersonnelFilesController,
    PersonnelOrdersController,
    LaborContractsController,
    PersonnelDocumentsController,
} from './controllers';

// Guards
import {
    PersonnelAccessGuard,
    RequireDirectorGuard,
} from './guards';

// Listeners
import {
    EmployeeOnboardedListener,
    EmployeeBeforeDeleteListener,
    LibraryArchivingCompletedListener,
    LibraryArchivingFailedListener,
    LegalDecisionListener,
} from './listeners';

@Module({
    imports: [EventEmitterModule.forRoot()],
    controllers: [
        PersonnelFilesController,
        PersonnelOrdersController,
        LaborContractsController,
        PersonnelDocumentsController,
    ],
    providers: [
        PrismaService,
        // Services
        HRDomainEventService,
        PersonalFileService,
        PersonnelOrderService,
        LaborContractService,
        PersonnelDocumentService,
        ArchiveIntegrationService,
        DocumentDeletionService,
        // Guards
        PersonnelAccessGuard,
        RequireDirectorGuard,
        // Listeners
        EmployeeOnboardedListener,
        EmployeeBeforeDeleteListener,
        LibraryArchivingCompletedListener,
        LibraryArchivingFailedListener,
        LegalDecisionListener,
    ],
    exports: [
        // Export services for use in other modules
        PersonalFileService,
        PersonnelOrderService,
        LaborContractService,
        PersonnelDocumentService,
        HRDomainEventService,
        ArchiveIntegrationService,
        DocumentDeletionService,
    ],
})
export class PersonnelModule { }
