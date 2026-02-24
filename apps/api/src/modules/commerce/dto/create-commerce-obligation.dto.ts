import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

const obligationTypes = ["DELIVER", "PAY", "PERFORM"] as const;

export class CreateCommerceObligationDto {
  @IsString()
  contractId!: string;

  @IsEnum(obligationTypes)
  type!: (typeof obligationTypes)[number];

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
