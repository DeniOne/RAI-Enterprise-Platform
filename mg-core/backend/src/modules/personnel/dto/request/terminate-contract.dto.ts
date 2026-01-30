import { IsString, IsDateString } from 'class-validator';

export class TerminateContractDto {
    @IsString()
    reason: string;

    @IsDateString()
    terminationDate: string;
}
