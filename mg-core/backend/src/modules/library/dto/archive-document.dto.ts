import { IsString, IsNotEmpty } from 'class-validator';

export class ArchiveDocumentDto {
    @IsString()
    @IsNotEmpty()
    reason: string;
}
