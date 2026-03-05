import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import type { EvidenceReference } from "./dto/rai-chat.dto";

export type ClaimTaxonomyType = "AGRO" | "FINANCE" | "LEGAL" | "SAFETY" | "GENERAL";

export type ClaimStatus = "VERIFIED" | "UNVERIFIED" | "INVALID";

const TAXONOMY_WEIGHTS: Record<ClaimTaxonomyType, number> = {
  AGRO: 3,
  FINANCE: 3,
  LEGAL: 3,
  SAFETY: 3,
  GENERAL: 1,
};

export interface ClaimWithClassification {
  evidence: EvidenceReference;
  taxonomy: ClaimTaxonomyType;
  status: ClaimStatus;
  weight: number;
}

@Injectable()
export class TruthfulnessEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateTraceTruthfulness(traceId: string, companyId: string): Promise<void> {
    const auditEntries = await this.prisma.aiAuditEntry.findMany({
      where: { traceId, companyId },
      orderBy: { createdAt: "asc" },
    });

    // Если по трейсу вообще нет записей — считаем, что BS% = 100 (ничего не знаем о честности)
    if (auditEntries.length === 0) {
      await this.updateTraceSummary(traceId, companyId, 100);
      return;
    }

    const evidenceRefs: EvidenceReference[] = [];
    for (const entry of auditEntries as Array<{ metadata?: unknown }>) {
      const meta = entry.metadata as
        | { evidence?: EvidenceReference[] }
        | undefined;
      if (meta?.evidence && Array.isArray(meta.evidence)) {
        evidenceRefs.push(...meta.evidence);
      }
    }

    // Нет evidence — агент говорит без пруфов → BS% = 100
    if (evidenceRefs.length === 0) {
      await this.updateTraceSummary(traceId, companyId, 100);
      return;
    }

    const classified = this.classifyEvidence(evidenceRefs);
    const totalWeight = classified.reduce((acc, c) => acc + c.weight, 0);
    if (totalWeight <= 0) {
      await this.updateTraceSummary(traceId, companyId, 100);
      return;
    }

    const unverifiedWeight = classified
      .filter((c) => c.status === "UNVERIFIED")
      .reduce((acc, c) => acc + c.weight, 0);
    const invalidWeight = classified
      .filter((c) => c.status === "INVALID")
      .reduce((acc, c) => acc + c.weight, 0);

    const bsFraction = (unverifiedWeight + invalidWeight) / totalWeight;
    const bsScorePct = Math.min(100, Math.max(0, Math.round(bsFraction * 100)));

    await this.updateTraceSummary(traceId, companyId, bsScorePct);
  }

  private classifyEvidence(evidence: EvidenceReference[]): ClaimWithClassification[] {
    return evidence.map((ev) => {
      const taxonomy = this.inferTaxonomy(ev);
      const status = this.inferStatus(ev);
      const weight = TAXONOMY_WEIGHTS[taxonomy];
      return { evidence: ev, taxonomy, status, weight };
    });
  }

  private inferTaxonomy(ev: EvidenceReference): ClaimTaxonomyType {
    const claim = ev.claim.toLowerCase();
    if (claim.includes("roi") || claim.includes("ebitda") || claim.includes("выручк")) {
      return "FINANCE";
    }
    if (claim.includes("норма высева") || claim.includes("bbch") || claim.includes("азот")) {
      return "AGRO";
    }
    if (claim.includes("договор") || claim.includes("contract")) {
      return "LEGAL";
    }
    if (claim.includes("риск") || claim.includes("опасн")) {
      return "SAFETY";
    }
    return "GENERAL";
  }

  private inferStatus(ev: EvidenceReference): ClaimStatus {
    if (!ev.sourceId || ev.sourceId.trim().length === 0) {
      return "UNVERIFIED";
    }
    if (ev.confidenceScore < 0.3) {
      return "INVALID";
    }
    if (ev.confidenceScore < 0.6) {
      return "UNVERIFIED";
    }
    return "VERIFIED";
  }

  private async updateTraceSummary(
    traceId: string,
    companyId: string,
    bsScorePct: number,
  ): Promise<void> {
    await this.prisma.traceSummary.updateMany({
      where: { traceId, companyId },
      data: { bsScorePct },
    });
  }
}

