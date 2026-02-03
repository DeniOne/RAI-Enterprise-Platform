import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

@InputType()
export class TaskResourceActualInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    type: string;

    @Field()
    @IsString()
    @IsNotEmpty()
    name: string;

    @Field(() => Float)
    @IsNumber()
    amount: number;

    @Field()
    @IsString()
    @IsNotEmpty()
    unit: string;
}
