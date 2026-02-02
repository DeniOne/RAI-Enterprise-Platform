import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { RapeseedType } from '@prisma/client';
import { IsString, IsOptional, IsEnum, IsInt, IsNumber, Min } from 'class-validator';

@InputType()
export class CreateRapeseedInput {
    @Field(() => String)
    @IsString()
    name: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    variety?: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    reproduction?: string;

    @Field(() => RapeseedType)
    @IsEnum(RapeseedType)
    type: RapeseedType;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    oilContent?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    erucicAcid?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    glucosinolates?: number;

    @Field(() => Int)
    @IsInt()
    @Min(1)
    vegetationPeriod: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    sowingNormMin?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    sowingNormMax?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    sowingDepthMin?: number;

    @Field(() => Float, { nullable: true })
    @IsOptional()
    @IsNumber()
    sowingDepthMax?: number;
}
