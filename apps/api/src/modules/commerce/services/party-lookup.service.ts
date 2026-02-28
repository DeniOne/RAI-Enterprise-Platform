import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuditService } from "../../../shared/audit/audit.service";
import { RedisService } from "../../../shared/redis/redis.service";
import { PartyLookupRequestDto } from "../dto/party-lookup.dto";
import {
  CounterpartyLookupProvider,
  PartyLookupRequest,
  PartyLookupResponse,
  normalizeLookupQueryValue,
} from "./party-lookup.types";
import { DaDataProvider } from "./providers/dadata.provider";
import { ByKzStubLookupProvider } from "./providers/by-kz-stub.provider";
import { isRuInnValid } from "./ru-inn.validator";

const LOOKUP_CACHE_TTL_SECONDS = 86_400;

@Injectable()
export class PartyLookupService {
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    private readonly dadataProvider: DaDataProvider,
    private readonly byKzStubProvider: ByKzStubLookupProvider,
  ) {}

  async lookup(input: {
    companyId: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    request: PartyLookupRequestDto;
  }): Promise<PartyLookupResponse> {
    const request = this.normalizeRequest(input.request);
    const requestKey = this.buildRequestKey(request);
    const identifier = this.buildIdentifier(request) || requestKey;
    const cacheKey = `party_lookup:${request.jurisdictionId}:${identifier}`;
    const timestamp = new Date().toISOString();

    if (
      request.jurisdictionId === "RU" &&
      (!request.identifiers.inn || !isRuInnValid(request.identifiers.inn, request.partyType))
    ) {
      const invalidInnResponse: PartyLookupResponse = {
        status: "ERROR",
        source: "DADATA",
        fetchedAt: timestamp,
        requestKey,
        error: "ИНН невалиден (checksum). Lookup не выполнен.",
      };
      await this.writeAudit({
        companyId: input.companyId,
        userId: input.userId,
        ip: input.ip,
        userAgent: input.userAgent,
        identifier,
        provider: invalidInnResponse.source,
        status: invalidInnResponse.status,
        timestamp,
        requestKey,
        cacheHit: false,
      });
      return invalidInnResponse;
    }

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as PartyLookupResponse;
        const cachedResponse: PartyLookupResponse = {
          ...parsed,
          requestKey: parsed.requestKey || requestKey,
          fetchedAt: parsed.fetchedAt || timestamp,
        };
        await this.writeAudit({
          companyId: input.companyId,
          userId: input.userId,
          ip: input.ip,
          userAgent: input.userAgent,
          identifier,
          provider: cachedResponse.source,
          status: cachedResponse.status,
          timestamp,
          requestKey: cachedResponse.requestKey,
          cacheHit: true,
        });
        return cachedResponse;
      } catch (error) {
        console.warn("[PartyLookup] Failed to parse cached payload", error);
      }
    }

    const provider = this.resolveProvider(request.jurisdictionId);
    const rawResponse = await provider.lookup(request);
    const response: PartyLookupResponse = {
      ...rawResponse,
      requestKey: rawResponse.requestKey || requestKey,
      fetchedAt: rawResponse.fetchedAt || timestamp,
    };

    if (response.status === "FOUND") {
      await this.redis.set(cacheKey, JSON.stringify(response), LOOKUP_CACHE_TTL_SECONDS);
    }

    await this.writeAudit({
      companyId: input.companyId,
      userId: input.userId,
      ip: input.ip,
      userAgent: input.userAgent,
      identifier,
      provider: response.source,
      status: response.status,
      timestamp,
      requestKey: response.requestKey,
      cacheHit: false,
    });

    return response;
  }

  private resolveProvider(jurisdictionId: string): CounterpartyLookupProvider {
    const normalized = jurisdictionId.toUpperCase();
    const primary = (
      this.config.get<string>("LOOKUP_PROVIDER_PRIMARY") || "DADATA"
    ).toUpperCase();

    if (normalized === "RU" && primary === "DADATA") {
      return this.dadataProvider;
    }

    if (this.byKzStubProvider.supports(normalized)) {
      return this.byKzStubProvider;
    }

    if (this.dadataProvider.supports(normalized)) {
      return this.dadataProvider;
    }

    return this.byKzStubProvider;
  }

  private normalizeRequest(dto: PartyLookupRequestDto): PartyLookupRequest {
    return {
      jurisdictionId: dto.jurisdictionId,
      partyType: dto.partyType,
      identifiers: {
        inn: normalizeLookupQueryValue(dto.identifiers?.inn),
        kpp: normalizeLookupQueryValue(dto.identifiers?.kpp),
        unp: normalizeLookupQueryValue(dto.identifiers?.unp),
        bin: normalizeLookupQueryValue(dto.identifiers?.bin),
      },
    };
  }

  private buildRequestKey(request: PartyLookupRequest): string {
    return [
      request.jurisdictionId,
      request.partyType,
      request.identifiers.inn ?? "",
      request.identifiers.kpp ?? "",
      request.identifiers.unp ?? "",
      request.identifiers.bin ?? "",
    ].join(":");
  }

  private buildIdentifier(request: PartyLookupRequest): string {
    if (request.jurisdictionId === "RU") {
      const inn = request.identifiers.inn ?? "";
      const kpp = request.identifiers.kpp ?? "";
      return kpp ? `${inn}:${kpp}` : inn;
    }
    if (request.jurisdictionId === "BY") {
      return request.identifiers.unp ?? "";
    }
    if (request.jurisdictionId === "KZ") {
      return request.identifiers.bin ?? "";
    }
    return "";
  }

  private async writeAudit(input: {
    companyId: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    identifier: string;
    provider: string;
    status: string;
    timestamp: string;
    requestKey: string;
    cacheHit: boolean;
  }): Promise<void> {
    try {
      await this.audit.log({
        action: "party_lookup",
        companyId: input.companyId,
        userId: input.userId,
        ip: input.ip,
        userAgent: input.userAgent,
        metadata: {
          tenantId: input.companyId,
          identifier: input.identifier,
          provider: input.provider,
          status: input.status,
          timestamp: input.timestamp,
          requestKey: input.requestKey,
          cacheHit: input.cacheHit,
        },
      });
    } catch (error) {
      console.warn("[PartyLookup] Audit logging failed", error);
    }
  }
}
