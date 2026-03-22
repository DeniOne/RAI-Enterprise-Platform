export const TECH_MAP_SOURCE_AUTHORITY_CLASSES = [
  "REGULATORY_OR_SIGNED",
  "APPROVED_INTERNAL_MASTER",
  "VERIFIED_MEASUREMENT",
  "EXECUTION_FACT",
  "PREVIOUS_TECH_MAP",
  "USER_DECLARATION",
  "MODEL_ESTIMATE",
] as const;

export type TechMapSourceAuthorityClass =
  (typeof TECH_MAP_SOURCE_AUTHORITY_CLASSES)[number];

export const TECH_MAP_SLOT_FAMILIES = [
  "identity_scope",
  "agronomic_measurement",
  "economic_basis",
  "methodology_and_compliance",
] as const;

export type TechMapSlotFamily = (typeof TECH_MAP_SLOT_FAMILIES)[number];

export type TechMapAuthorityScopeLevel = "field" | "farm" | "company";

export interface TechMapAuthoritySourceCandidate {
  source_ref: string;
  authority_class: TechMapSourceAuthorityClass;
  verified_at?: string | null;
  scope_level?: TechMapAuthorityScopeLevel;
}

export const TECH_MAP_AUTHORITY_PRECEDENCE_BY_FAMILY: Record<
  TechMapSlotFamily,
  readonly TechMapSourceAuthorityClass[]
> = {
  identity_scope: [
    "REGULATORY_OR_SIGNED",
    "APPROVED_INTERNAL_MASTER",
    "PREVIOUS_TECH_MAP",
    "USER_DECLARATION",
    "MODEL_ESTIMATE",
  ],
  agronomic_measurement: [
    "VERIFIED_MEASUREMENT",
    "EXECUTION_FACT",
    "PREVIOUS_TECH_MAP",
    "USER_DECLARATION",
    "MODEL_ESTIMATE",
  ],
  economic_basis: [
    "REGULATORY_OR_SIGNED",
    "APPROVED_INTERNAL_MASTER",
    "EXECUTION_FACT",
    "PREVIOUS_TECH_MAP",
    "USER_DECLARATION",
    "MODEL_ESTIMATE",
  ],
  methodology_and_compliance: [
    "REGULATORY_OR_SIGNED",
    "APPROVED_INTERNAL_MASTER",
    "PREVIOUS_TECH_MAP",
    "USER_DECLARATION",
    "MODEL_ESTIMATE",
  ],
};

const scopeRank: Record<TechMapAuthorityScopeLevel, number> = {
  company: 1,
  farm: 2,
  field: 3,
};

export function getTechMapAuthorityRank(
  slotFamily: TechMapSlotFamily,
  authorityClass: TechMapSourceAuthorityClass,
): number {
  const precedence = TECH_MAP_AUTHORITY_PRECEDENCE_BY_FAMILY[slotFamily];
  const index = precedence.indexOf(authorityClass);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function toEpoch(input?: string | null): number {
  if (!input) {
    return 0;
  }
  const value = Date.parse(input);
  return Number.isNaN(value) ? 0 : value;
}

export function compareTechMapAuthoritySources(
  slotFamily: TechMapSlotFamily,
  left: TechMapAuthoritySourceCandidate,
  right: TechMapAuthoritySourceCandidate,
): number {
  const leftRank = getTechMapAuthorityRank(slotFamily, left.authority_class);
  const rightRank = getTechMapAuthorityRank(slotFamily, right.authority_class);

  if (leftRank !== rightRank) {
    return leftRank < rightRank ? 1 : -1;
  }

  const leftTime = toEpoch(left.verified_at);
  const rightTime = toEpoch(right.verified_at);

  if (leftTime !== rightTime) {
    return leftTime > rightTime ? 1 : -1;
  }

  const leftScope = scopeRank[left.scope_level ?? "company"];
  const rightScope = scopeRank[right.scope_level ?? "company"];

  if (leftScope !== rightScope) {
    return leftScope > rightScope ? 1 : -1;
  }

  return 0;
}

export function selectTechMapAuthorityWinner(
  slotFamily: TechMapSlotFamily,
  candidates: TechMapAuthoritySourceCandidate[],
): TechMapAuthoritySourceCandidate | null {
  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((winner, candidate) =>
    compareTechMapAuthoritySources(slotFamily, winner, candidate) >= 0
      ? winner
      : candidate,
  );
}
