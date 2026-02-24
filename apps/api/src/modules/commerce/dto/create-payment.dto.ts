import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreatePaymentDto {
  @IsString()
  payerPartyId!: string;

  @IsString()
  payeePartyId!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  currency!: string;

  @IsString()
  paymentMethod!: string;

  @IsOptional()
  @IsString()
  paidAt?: string;
}

export class CreatePaymentAllocationDto {
  @IsString()
  paymentId!: string;

  @IsString()
  invoiceId!: string;

  @IsNumber()
  allocatedAmount!: number;
}
