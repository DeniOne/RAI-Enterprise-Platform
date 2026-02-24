import { Module } from "@nestjs/common";
import { CommerceContractService } from "./services/commerce-contract.service";
import { FulfillmentService } from "./services/fulfillment.service";
import { BillingService } from "./services/billing.service";
import { IntercompanyService } from "./services/intercompany.service";
import { CommerceController } from "./commerce.controller";

@Module({
  controllers: [CommerceController],
  providers: [
    CommerceContractService,
    FulfillmentService,
    BillingService,
    IntercompanyService,
  ],
  exports: [
    CommerceContractService,
    FulfillmentService,
    BillingService,
    IntercompanyService,
  ],
})
export class CommerceModule {}
