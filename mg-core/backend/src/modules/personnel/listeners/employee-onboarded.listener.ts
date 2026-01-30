import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PersonalFileService } from '../services/personal-file.service';
import { PrismaService } from '@/prisma/prisma.service';

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
@Injectable()
export class EmployeeOnboardedListener {
    private readonly logger = new Logger(EmployeeOnboardedListener.name);

    constructor(
        private readonly personalFileService: PersonalFileService,
        private readonly prisma: PrismaService,
    ) { }

    @OnEvent('employee.onboarded') // ✅ ONBOARDED, not HIRED
    async handleEmployeeOnboarded(payload: EmployeeOnboardedEvent) {
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
        await this.personalFileService.create(
            payload.employeeId,
            payload.onboardedBy || 'SYSTEM',
            payload.onboardedByRole || 'HR_MANAGER'
        );

        this.logger.log(`PersonalFile created for employee ${payload.employeeId}`);
    }
}

// Event payload interface
interface EmployeeOnboardedEvent {
    employeeId: string;
    userId: string;
    onboardedAt: Date;
    onboardedBy?: string;
    onboardedByRole?: string;
}
