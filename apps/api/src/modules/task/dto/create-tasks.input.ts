import { InputType, Field } from "@nestjs/graphql";
import { IsNotEmpty, IsString } from "class-validator";

@InputType()
export class CreateTasksFromSeasonInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  seasonId: string;
}
