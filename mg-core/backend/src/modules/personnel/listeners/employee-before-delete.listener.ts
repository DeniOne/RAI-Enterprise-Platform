import { Injectable, ForbiddenException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * EmployeeBeforeDeleteListener
 * 
 * CRITICAL: Prevents employee deletion if PersonalFile exists
 * 
 * Reason: PersonalFile contains juridical documents that must be archived first
 * 
 * Suggestion: Archive PersonalFile before deleting employee
 */
@Injectable()
export class EmployeeBeforeDeleteListener {
    constructor(private readonly prisma: PrismaService) { }

    @OnEvent('employee.before_delete')
    async handleEmployeeBeforeDelete(payload: EmployeeBeforeDeleteEvent) {
        const personalFile = await this.prisma.personalFile.findUnique({
            where: { employeeId: payload.employeeId },
        });

        if (personalFile) {
            throw new ForbiddenException({
                message: 'Cannot delete employee with existing PersonalFile',
                suggestion: 'Archive PersonalFile first',
                personalFileId: personalFile.id,
                personalFileStatus: personalFile.hrStatus,
            });
        }
    }
}

// Event payload interface
interface EmployeeBeforeDeleteEvent {
    employeeId: string;
}
