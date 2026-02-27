import { Module } from "@nestjs/common";
import { CommerceContractService } from "./services/commerce-contract.service";
import { FulfillmentService } from "./services/fulfillment.service";
import { BillingService } from "./services/billing.service";
import { IntercompanyService } from "./services/intercompany.service";
import { PartyService } from "./services/party.service";
import { CommerceController } from "./commerce.controller";
import { PartyController } from "./party.controller";
import { PartyLookupController } from "./party-lookup.controller";
import { PartyLookupService } from "./services/party-lookup.service";
import { DaDataProvider } from "./services/providers/dadata.provider";
import { ByKzStubLookupProvider } from "./services/providers/by-kz-stub.provider";

import { AuthModule } from "../../shared/auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [CommerceController, PartyController, PartyLookupController],
  providers: [
    CommerceContractService,
    FulfillmentService,
    BillingService,
    IntercompanyService,
    PartyService,
    PartyLookupService,
    DaDataProvider,
    ByKzStubLookupProvider,
  ],
  exports: [
    CommerceContractService,
    FulfillmentService,
    BillingService,
    IntercompanyService,
    PartyService,
    PartyLookupService,
  ],
})
export class CommerceModule { }
