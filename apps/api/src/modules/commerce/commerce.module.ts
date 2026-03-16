import { Module } from "@nestjs/common";
import { CommerceContractService } from "./services/commerce-contract.service";
import { FulfillmentService } from "./services/fulfillment.service";
import { BillingService } from "./services/billing.service";
import { IntercompanyService } from "./services/intercompany.service";
import { PartyService } from "./services/party.service";
import { CommerceController } from "./commerce.controller";
import { PartyController } from "./party.controller";
import { PartyAssetsController } from "./party-assets.controller";
import { PartyLookupController } from "./party-lookup.controller";
import { IdentificationSchemaController } from "./identification-schema.controller";
import { PartyLookupService } from "./services/party-lookup.service";
import { BankLookupService } from "./services/bank-lookup.service";
import { AssetRoleService } from "./services/asset-role.service";
import { DaDataProvider } from "./services/providers/dadata.provider";
import { ByKzStubLookupProvider } from "./services/providers/by-kz-stub.provider";
import { IdentificationSchemaService } from "./services/identification-schema.service";

import { AuthModule } from "../../shared/auth/auth.module";
import { IdempotencyModule } from "../../shared/idempotency/idempotency.module";

@Module({
  imports: [AuthModule, IdempotencyModule],
  controllers: [CommerceController, PartyController, PartyAssetsController, PartyLookupController, IdentificationSchemaController],
  providers: [
    CommerceContractService,
    FulfillmentService,
    BillingService,
    IntercompanyService,
    PartyService,
    AssetRoleService,
    PartyLookupService,
    BankLookupService,
    IdentificationSchemaService,
    DaDataProvider,
    ByKzStubLookupProvider,
  ],
  exports: [
    CommerceContractService,
    FulfillmentService,
    BillingService,
    IntercompanyService,
    PartyService,
    AssetRoleService,
    PartyLookupService,
    BankLookupService,
    IdentificationSchemaService,
  ],
})
export class CommerceModule { }
