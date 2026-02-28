import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  CounterpartyLookupProvider,
  PartyLookupRequest,
  PartyLookupResponse,
} from "../party-lookup.types";

type DaDataApiResponse = {
  suggestions?: Array<{
    value?: string;
    data?: {
      inn?: string;
      kpp?: string;
      ogrn?: string;
      ogrnip?: string;
      name?: {
        full_with_opf?: string;
        short_with_opf?: string;
      };
      address?: {
        value?: string;
      };
      state?: {
        status?: string;
        registration_date?: string | number | null;
      };
      management?: {
        name?: string;
      };
      okved?: string;
    };
  }>;
};

@Injectable()
export class DaDataProvider implements CounterpartyLookupProvider {
  constructor(private readonly config: ConfigService) {}

  supports(jurisdictionId: string): boolean {
    return jurisdictionId.toUpperCase() === "RU";
  }

  async lookup(req: PartyLookupRequest): Promise<PartyLookupResponse> {
    const token = this.config.get<string>("DADATA_API_KEY");
    const secret = this.config.get<string>("DADATA_SECRET_KEY");
    const requestKey = this.buildRequestKey(req);
    const fetchedAt = new Date().toISOString();

    if (!token) {
      return {
        status: "ERROR",
        source: "DADATA",
        fetchedAt,
        requestKey,
        error: "Не настроен ключ DADATA_API_KEY.",
      };
    }

    const inn = req.identifiers.inn?.trim();
    if (!inn) {
      return {
        status: "NOT_FOUND",
        source: "DADATA",
        fetchedAt,
        requestKey,
      };
    }

    try {
      const payload = {
        query: inn,
        kpp: req.identifiers.kpp?.trim() || undefined,
      };

      const response = await fetch(
        "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Token ${token}`,
            ...(secret ? { "X-Secret": secret } : {}),
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        return {
          status: "ERROR",
          source: "DADATA",
          fetchedAt,
          requestKey,
          error: `DaData вернул HTTP ${response.status}`,
        };
      }

      const body = (await response.json()) as DaDataApiResponse;
      const candidate = body.suggestions?.[0];
      const data = candidate?.data;
      if (!candidate || !data) {
        return {
          status: "NOT_FOUND",
          source: "DADATA",
          fetchedAt,
          requestKey,
        };
      }

      const registeredAt = this.parseRegisteredAt(data.state?.registration_date);

      return {
        status: "FOUND",
        source: "DADATA",
        fetchedAt,
        requestKey,
        result: {
          legalName:
            data.name?.full_with_opf?.trim() ||
            candidate.value?.trim() ||
            "",
          shortName: data.name?.short_with_opf?.trim() || undefined,
          requisites: {
            inn: data.inn?.trim() || undefined,
            kpp: data.kpp?.trim() || undefined,
            ogrn: data.ogrn?.trim() || undefined,
            ogrnip: data.ogrnip?.trim() || undefined,
          },
          addresses: data.address?.value
            ? [{ type: "LEGAL", full: data.address.value }]
            : [],
          meta: {
            status: data.state?.status || undefined,
            managerName: data.management?.name || undefined,
            okved: data.okved || undefined,
            registeredAt,
          },
        },
      };
    } catch (error) {
      return {
        status: "ERROR",
        source: "DADATA",
        fetchedAt,
        requestKey,
        error:
          error instanceof Error
            ? error.message
            : "Неизвестная ошибка провайдера DADATA.",
      };
    }
  }

  private parseRegisteredAt(value: string | number | null | undefined): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "number") {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
    }
    const normalized = value.trim();
    if (!normalized) {
      return undefined;
    }
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
  }

  private buildRequestKey(req: PartyLookupRequest): string {
    return [
      req.jurisdictionId,
      req.partyType,
      req.identifiers.inn ?? "",
      req.identifiers.kpp ?? "",
      req.identifiers.unp ?? "",
      req.identifiers.bin ?? "",
    ].join(":");
  }
}
