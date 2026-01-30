import { IsEnum, IsString, IsOptional } from 'class-validator';
import { HRStatus } from '@prisma/client';

export class UpdateStatusDto {
    @IsEnum(HRStatus)
    newStatus: HRStatus;

    @IsString()
    @IsOptional()
    reason?: string;
}
