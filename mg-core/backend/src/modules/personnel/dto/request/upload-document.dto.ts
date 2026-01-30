import { IsEnum, IsString, IsNumber, IsDateString, IsOptional } from 'class-validator';
import { PersonnelDocumentType } from '@prisma/client';

export class UploadDocumentDto {
    @IsEnum(PersonnelDocumentType)
    documentType: PersonnelDocumentType;

    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    fileId: string;

    @IsString()
    fileName: string;

    @IsNumber()
    fileSize: number;

    @IsString()
    mimeType: string;

    @IsDateString()
    @IsOptional()
    issueDate?: string;

    @IsDateString()
    @IsOptional()
    expiryDate?: string;

    @IsString()
    @IsOptional()
    issuer?: string;

    @IsString()
    @IsOptional()
    documentNumber?: string;
}
