import { Injectable } from "@nestjs/common";
import {
  CounterpartyLookupProvider,
  PartyLookupRequest,
  PartyLookupResponse,
} from "../party-lookup.types";

@Injectable()
export class ByKzStubLookupProvider implements CounterpartyLookupProvider {
  supports(jurisdictionId: string): boolean {
    const normalized = jurisdictionId.toUpperCase();
    return normalized === "BY" || normalized === "KZ";
  }

  async lookup(req: PartyLookupRequest): Promise<PartyLookupResponse> {
    return {
      status: "NOT_SUPPORTED",
      source: "STUB",
      fetchedAt: new Date().toISOString(),
      requestKey: [
        req.jurisdictionId,
        req.partyType,
        req.query.inn ?? "",
        req.query.kpp ?? "",
        req.query.unp ?? "",
        req.query.bin ?? "",
      ].join(":"),
      error: "Провайдер для выбранной юрисдикции пока не подключен.",
    };
  }
}
