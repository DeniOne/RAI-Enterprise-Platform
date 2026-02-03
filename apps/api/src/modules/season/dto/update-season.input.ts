import { InputType, Field, PartialType, Float } from "@nestjs/graphql";
import { CreateSeasonInput } from "./create-season.input";
import { IsString, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

@InputType()
export class UpdateSeasonInput extends PartialType(CreateSeasonInput) {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  actualYield?: number;
}
