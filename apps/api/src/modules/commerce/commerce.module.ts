import { Module } from "@nestjs/common";
import { CommerceContractService } from "./services/commerce-contract.service";
import { FulfillmentService } from "./services/fulfillment.service";
import { BillingService } from "./services/billing.service";
import { IntercompanyService } from "./services/intercompany.service";
import { PartyService } from "./services/party.service";
import { CommerceController } from "./commerce.controller";
import { PartyController } from "./party.controller";

import { AuthModule } from "../../shared/auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [CommerceController, PartyController],
  providers: [
    CommerceContractService,
    FulfillmentService,
    BillingService,
    IntercompanyService,
    PartyService,
  ],
  exports: [
    CommerceContractService,
    FulfillmentService,
    BillingService,
    IntercompanyService,
    PartyService,
  ],
})
export class CommerceModule { }
