import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";

const domainValues = ["COMMERCIAL", "PRODUCTION", "LOGISTICS", "FINANCE_ADJ"] as const;
const typeValues = [
  "GOODS_SHIPMENT",
  "SERVICE_ACT",
  "LEASE_USAGE",
  "MATERIAL_CONSUMPTION",
  "HARVEST",
  "INTERNAL_TRANSFER",
  "WRITE_OFF",
] as const;

export class CreateFulfillmentEventDto {
  @IsString()
  @IsNotEmpty()
  obligationId!: string;

  @IsEnum(domainValues)
  eventDomain!: (typeof domainValues)[number];

  @IsEnum(typeValues)
  eventType!: (typeof typeValues)[number];

  @IsDateString()
  eventDate!: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsOptional()
  @IsString()
  itemId?: string;

  @IsOptional()
  @IsString()
  uom?: string;

  @IsOptional()
  qty?: number;
}
