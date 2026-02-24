import { IsNumber, IsOptional, IsString } from "class-validator";

export class CreateInvoiceFromFulfillmentDto {
  @IsString()
  fulfillmentEventId!: string;

  @IsString()
  sellerJurisdiction!: string;

  @IsString()
  buyerJurisdiction!: string;

  @IsString()
  supplyType!: "GOODS" | "SERVICE" | "LEASE";

  @IsString()
  vatPayerStatus!: "PAYER" | "NON_PAYER";

  @IsNumber()
  subtotal!: number;

  @IsOptional()
  @IsString()
  productTaxCode?: string;
}
