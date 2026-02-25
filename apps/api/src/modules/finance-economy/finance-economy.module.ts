import { Module } from "@nestjs/common";
import { EconomyModule } from "./economy/economy.module";
import { FinanceModule } from "./finance/finance.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { OfsModule } from "./ofs/ofs.module";

@Module({
  imports: [EconomyModule, FinanceModule, IntegrationsModule, OfsModule],
})
export class FinanceEconomyModule {}
