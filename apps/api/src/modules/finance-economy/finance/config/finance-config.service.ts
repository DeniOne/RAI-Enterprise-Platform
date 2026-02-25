import { Injectable } from "@nestjs/common";

export interface FinanceConfig {
  requireIdempotency: boolean;
  contractCompatibilityMode: "strict" | "warn" | "off";
  panicThreshold: number;
  defaultCurrency: string;
  defaultScale: number;
}

@Injectable()
export class FinanceConfigService {
  private readonly config: FinanceConfig;

  constructor() {
    this.config = {
      requireIdempotency: process.env.FINANCIAL_REQUIRE_IDEMPOTENCY !== "false",
      contractCompatibilityMode:
        (process.env.FINANCE_CONTRACT_COMPATIBILITY_MODE as any) || "strict",
      panicThreshold: Number(process.env.FINANCIAL_PANIC_THRESHOLD || 5),
      defaultCurrency: process.env.FINANCE_DEFAULT_CURRENCY || "RUB",
      defaultScale: Number(process.env.FINANCE_DEFAULT_SCALE || 2),
    };

    // Manual Validation (Hardening)
    if (
      !["strict", "warn", "off"].includes(this.config.contractCompatibilityMode)
    ) {
      this.config.contractCompatibilityMode = "strict";
    }
  }

  get<K extends keyof FinanceConfig>(key: K): FinanceConfig[K] {
    return this.config[key];
  }
}
