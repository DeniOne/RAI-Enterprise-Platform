import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePersonalFileDto {
    @IsString()
    @IsNotEmpty()
    employeeId: string;

    @IsString()
    @IsOptional()
    reason?: string;
}
