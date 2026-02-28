import { IsNotEmpty, IsString } from "class-validator";

export class IdentificationSchemaQueryDto {
  @IsString()
  @IsNotEmpty()
  partyType!: string;
}
