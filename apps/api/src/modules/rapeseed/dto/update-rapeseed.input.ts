import { InputType, Field, PartialType } from "@nestjs/graphql";
import { CreateRapeseedInput } from "./create-rapeseed.input";
import { IsString, IsNotEmpty } from "class-validator";

@InputType()
export class UpdateRapeseedInput extends PartialType(CreateRapeseedInput) {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field(() => String, { nullable: true })
  @IsString()
  changeReason?: string;
}
