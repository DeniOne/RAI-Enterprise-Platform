import { Injectable } from "@nestjs/common";
import { AuditService } from "../../../shared/audit/audit.service";
import { RedisService } from "../../../shared/redis/redis.service";
import { DaDataProvider } from "./providers/dadata.provider";
import { BankLookupRequestDto } from "../dto/bank-lookup.dto";
import { BankLookupResponse } from "./bank-lookup.types";

const BANK_LOOKUP_CACHE_TTL_SECONDS = 86_400;

@Injectable()
export class BankLookupService {
  constructor(
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    private readonly dadataProvider: DaDataProvider,
  ) {}

  async lookup(input: {
    companyId: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    request: BankLookupRequestDto;
  }): Promise<BankLookupResponse> {
    const bic = input.request.bic.trim();
    const requestKey = `RU:BANK:${bic}`;
    const timestamp = new Date().toISOString();
    const cacheKey = `bank_lookup:RU:${bic}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as BankLookupResponse;
        const cachedResponse: BankLookupResponse = {
          ...parsed,
          requestKey: parsed.requestKey || requestKey,
          fetchedAt: parsed.fetchedAt || timestamp,
        };
        await this.writeAudit({
          companyId: input.companyId,
          userId: input.userId,
          ip: input.ip,
          userAgent: input.userAgent,
          bic,
          status: cachedResponse.status,
          timestamp,
          requestKey: cachedResponse.requestKey,
          cacheHit: true,
        });
        return cachedResponse;
      } catch (error) {
        console.warn("[BankLookup] Failed to parse cached payload", error);
      }
    }

    const response = await this.dadataProvider.lookupBankByBic({ bic });

    if (response.status === "FOUND") {
      await this.redis.set(cacheKey, JSON.stringify(response), BANK_LOOKUP_CACHE_TTL_SECONDS);
    }

    await this.writeAudit({
      companyId: input.companyId,
      userId: input.userId,
      ip: input.ip,
      userAgent: input.userAgent,
      bic,
      status: response.status,
      timestamp,
      requestKey: response.requestKey,
      cacheHit: false,
    });

    return response;
  }

  private async writeAudit(input: {
    companyId: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    bic: string;
    status: string;
    timestamp: string;
    requestKey: string;
    cacheHit: boolean;
  }) {
    try {
      await this.audit.log({
        action: "bank_lookup",
        companyId: input.companyId,
        userId: input.userId,
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: {
          tenantId: input.companyId,
          bic: input.bic,
          provider: "DADATA",
          status: input.status,
          timestamp: input.timestamp,
          requestKey: input.requestKey,
          cacheHit: input.cacheHit,
        },
      });
    } catch (error) {
      console.warn("[BankLookup] Audit logging failed", error);
    }
  }
}
