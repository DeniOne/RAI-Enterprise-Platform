import { HRStatus } from '@prisma/client';

export class PersonalFileResponseDto {
    id: string;
    employeeId: string;
    fileNumber: string;
    hrStatus: HRStatus;
    openedAt: Date;
    closedAt?: Date;
    archiveId?: string;
    libraryDocumentId?: string;
    createdAt: Date;
    updatedAt: Date;

    // Relations (optional)
    employee?: any;
    documents?: any[];
    orders?: any[];
    contracts?: any[];
}
