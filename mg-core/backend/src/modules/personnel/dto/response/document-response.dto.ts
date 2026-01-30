import { PersonnelDocumentType } from '@prisma/client';

export class DocumentResponseDto {
    id: string;
    personalFileId: string;
    documentType: PersonnelDocumentType;
    title: string;
    description?: string;
    fileId: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    issueDate?: Date;
    expiryDate?: Date;
    issuer?: string;
    documentNumber?: string;
    uploadedById: string;
    createdAt: Date;
    updatedAt: Date;

    // Relations (optional)
    personalFile?: any;
}
