import { IsString, IsNotEmpty } from 'class-validator';

export class DestroyDocumentDto {
    @IsString()
    @IsNotEmpty()
    legalBasis: string;

    @IsString()
    @IsNotEmpty()
    approvedBy: string; // Legal counsel ID
}
