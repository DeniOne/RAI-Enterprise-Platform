import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDocumentDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    documentType: string; // from Registry (HR_PERSONAL_FILE, etc.)

    @IsString()
    @IsNotEmpty()
    businessOwnerRole: string; // HR_MANAGER, LEGAL_COUNSEL, etc.
}
