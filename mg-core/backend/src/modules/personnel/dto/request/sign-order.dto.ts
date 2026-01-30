import { IsString } from 'class-validator';

export class SignOrderDto {
    @IsString()
    signerId: string;
}
