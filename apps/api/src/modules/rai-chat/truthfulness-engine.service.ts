import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import type { EvidenceReference } from "./dto/rai-chat.dto";
import { BranchVerdict } from "../../shared/rai-chat/branch-trust.types";

export type ClaimTaxonomyType = "AGRO" | "FINANCE" | "LEGAL" | "SAFETY" | "GENERAL";

export type ClaimStatus = "VERIFIED" | "UNVERIFIED" | "INVALID";

const TAXONOMY_WEIGHTS: Record<ClaimTaxonomyType, number> = {
  AGRO: 3,
  FINANCE: 3,
  LEGAL: 3,
  SAFETY: 3,
  GENERAL: 1,
};

export interface TruthfulnessResult {
  bsScorePct: number | null;
  evidenceCoveragePct: number | null;
  invalidClaimsPct: number | null;
  accounting: {
    total: number;
    evidenced: number;
    verified: number;
    unverified: number;
    invalid: number;
  };
  qualityStatus: "READY" | "PENDING_EVIDENCE";
}

export interface TruthfulnessAccounting {
  total: number;
  evidenced: number;
  verified: number;
  unverified: number;
  invalid: number;
}

export interface ClaimWithClassification {
  evidence: EvidenceReference;
  taxonomy: ClaimTaxonomyType;
  status: ClaimStatus;
  weight: number;
}

export interface BranchTrustInputs {
  classifiedEvidence: ClaimWithClassification[];
  accounting: TruthfulnessAccounting;
  totalWeight: number;
  weightedEvidence: {
    verified: number;
    unverified: number;
    invalid: number;
  };
  bsScorePct: number | null;
  evidenceCoveragePct: number | null;
  invalidClaimsPct: number | null;
  qualityStatus: "READY" | "PENDING_EVIDENCE";
  recommendedVerdict: BranchVerdict;
  requiresCrossCheck: boolean;
  reasons: string[];
}

@Injectable()
export class TruthfulnessEngineService {
  constructor(private readonly prisma: PrismaService) { }

  async calculateTraceTruthfulness(traceId: string, companyId: string): Promise<TruthfulnessResult> {
    const auditEntries = await this.prisma.aiAuditEntry.findMany({
      where: { traceId, companyId },
      orderBy: { createdAt: "asc" },
    });

    if (auditEntries.length === 0) {
      return this.buildPendingTruthfulnessResult();
    }

    const evidenceRefs = this.collectEvidenceReferences(
      auditEntries as Array<{ metadata?: unknown }>,
    );

    if (evidenceRefs.length === 0) {
      return this.buildPendingTruthfulnessResult();
    }

    const branchInputs = this.buildBranchTrustInputs(evidenceRefs);

    return {
      bsScorePct: branchInputs.bsScorePct,
      evidenceCoveragePct: branchInputs.evidenceCoveragePct,
      invalidClaimsPct: branchInputs.invalidClaimsPct,
      accounting: branchInputs.accounting,
      qualityStatus: branchInputs.qualityStatus,
    };
  }

  classifyBranchEvidence(
    evidence: EvidenceReference[],
  ): ClaimWithClassification[] {
    return evidence.map((ev) => {
      const taxonomy = this.inferTaxonomy(ev);
      const status = this.resolveEvidenceStatus(ev);
      const weight = TAXONOMY_WEIGHTS[taxonomy];
      return { evidence: ev, taxonomy, status, weight };
    });
  }

  buildBranchTrustInputs(evidence: EvidenceReference[]): BranchTrustInputs {
    if (evidence.length === 0) {
      return this.buildPendingBranchTrustInputs();
    }

    const classifiedEvidence = this.classifyBranchEvidence(evidence);
    const accounting: TruthfulnessAccounting = {
      total: classifiedEvidence.length,
      evidenced: classifiedEvidence.filter((c) => c.evidence.sourceId?.trim())
        .length,
      verified: classifiedEvidence.filter((c) => c.status === "VERIFIED").length,
      unverified: classifiedEvidence.filter((c) => c.status === "UNVERIFIED")
        .length,
      invalid: classifiedEvidence.filter((c) => c.status === "INVALID").length,
    };
    const totalWeight = classifiedEvidence.reduce(
      (acc, claim) => acc + claim.weight,
      0,
    );

    if (totalWeight <= 0 || accounting.total === 0) {
      return this.buildPendingBranchTrustInputs();
    }

    const weightedEvidence = {
      verified: classifiedEvidence
        .filter((c) => c.status === "VERIFIED")
        .reduce((acc, claim) => acc + claim.weight, 0),
      unverified: classifiedEvidence
        .filter((c) => c.status === "UNVERIFIED")
        .reduce((acc, claim) => acc + claim.weight, 0),
      invalid: classifiedEvidence
        .filter((c) => c.status === "INVALID")
        .reduce((acc, claim) => acc + claim.weight, 0),
    };
    const bsFraction =
      (weightedEvidence.unverified + weightedEvidence.invalid) / totalWeight;
    const bsScorePct = Math.min(
      100,
      Math.max(0, Math.round(bsFraction * 100)),
    );
    const evidenceCoveragePct = Math.round(
      (accounting.evidenced / accounting.total) * 100,
    );
    const invalidClaimsPct = Math.round(
      (accounting.invalid / accounting.total) * 100,
    );
    const recommendedVerdict = this.resolveRecommendedVerdict(accounting);

    return {
      classifiedEvidence,
      accounting,
      totalWeight,
      weightedEvidence,
      bsScorePct,
      evidenceCoveragePct,
      invalidClaimsPct,
      qualityStatus: "READY",
      recommendedVerdict,
      requiresCrossCheck:
        recommendedVerdict === "UNVERIFIED" ||
        recommendedVerdict === "CONFLICTED" ||
        recommendedVerdict === "REJECTED",
      reasons: this.buildEvidenceReasons(accounting, evidenceCoveragePct),
    };
  }

  resolveEvidenceStatus(ev: EvidenceReference): ClaimStatus {
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

  private collectEvidenceReferences(
    auditEntries: Array<{ metadata?: unknown }>,
  ): EvidenceReference[] {
    const evidenceRefs: EvidenceReference[] = [];
    for (const entry of auditEntries) {
      const meta = entry.metadata as
        | { evidence?: EvidenceReference[] }
        | undefined;
      if (meta?.evidence && Array.isArray(meta.evidence)) {
        evidenceRefs.push(...meta.evidence);
      }
    }
    return evidenceRefs;
  }

  private buildPendingTruthfulnessResult(): TruthfulnessResult {
    return {
      bsScorePct: null,
      evidenceCoveragePct: null,
      invalidClaimsPct: null,
      accounting: {
        total: 0,
        evidenced: 0,
        verified: 0,
        unverified: 0,
        invalid: 0,
      },
      qualityStatus: "PENDING_EVIDENCE",
    };
  }

  private buildPendingBranchTrustInputs(): BranchTrustInputs {
    return {
      classifiedEvidence: [],
      accounting: {
        total: 0,
        evidenced: 0,
        verified: 0,
        unverified: 0,
        invalid: 0,
      },
      totalWeight: 0,
      weightedEvidence: {
        verified: 0,
        unverified: 0,
        invalid: 0,
      },
      bsScorePct: null,
      evidenceCoveragePct: null,
      invalidClaimsPct: null,
      qualityStatus: "PENDING_EVIDENCE",
      recommendedVerdict: "UNVERIFIED",
      requiresCrossCheck: true,
      reasons: ["no_evidence"],
    };
  }

  private resolveRecommendedVerdict(
    accounting: TruthfulnessAccounting,
  ): BranchVerdict {
    if (accounting.total === 0) {
      return "UNVERIFIED";
    }
    if (accounting.verified === accounting.total) {
      return "VERIFIED";
    }
    if (accounting.invalid > 0 && accounting.verified > 0) {
      return "CONFLICTED";
    }
    if (accounting.invalid === accounting.total) {
      return "REJECTED";
    }
    if (accounting.unverified === accounting.total) {
      return "UNVERIFIED";
    }
    if (accounting.verified > 0 && accounting.unverified > 0) {
      return "PARTIAL";
    }
    if (accounting.invalid > 0 && accounting.unverified > 0) {
      return "UNVERIFIED";
    }
    return "PARTIAL";
  }

  private buildEvidenceReasons(
    accounting: TruthfulnessAccounting,
    evidenceCoveragePct: number,
  ): string[] {
    return [
      ...(accounting.evidenced === 0 ? ["no_evidence_sources"] : []),
      ...(evidenceCoveragePct < 100 ? ["partial_evidence_coverage"] : []),
      ...(accounting.invalid > 0 ? ["invalid_evidence_present"] : []),
      ...(accounting.unverified > 0 ? ["unverified_evidence_present"] : []),
      ...(accounting.verified > 0 &&
      (accounting.unverified > 0 || accounting.invalid > 0)
        ? ["mixed_evidence_quality"]
        : []),
    ];
  }
}
