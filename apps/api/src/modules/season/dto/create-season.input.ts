import { InputType, Field, Int, Float } from "@nestjs/graphql";
import { SeasonStatus } from "@prisma/client";
import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
} from "class-validator";

@InputType()
export class CreateSeasonInput {
  @Field(() => Int)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;

  @Field(() => SeasonStatus, { defaultValue: SeasonStatus.PLANNING })
  @IsOptional()
  @IsEnum(SeasonStatus)
  status?: SeasonStatus;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  fieldId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  rapeseedId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  technologyCardId?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  expectedYield?: number;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  endDate?: Date;
}
