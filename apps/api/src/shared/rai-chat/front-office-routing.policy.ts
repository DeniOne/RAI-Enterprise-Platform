export type FrontOfficeThreadClassification =
  | "free_chat"
  | "task_process"
  | "client_request"
  | "escalation_signal";

export interface FrontOfficeOwnerRoutingRule {
  id: string;
  role: string;
  reason: string;
  patterns: RegExp[];
}

export interface FrontOfficeClassificationRule {
  id: string;
  classification: FrontOfficeThreadClassification;
  confidence: number;
  reason: string;
  needsEscalation: boolean;
  patterns: RegExp[];
  defaultOwnerRole?: string;
}

export interface FrontOfficePolicyClassification {
  classification: FrontOfficeThreadClassification;
  confidence: number;
  reasons: string[];
  targetOwnerRole?: string;
  needsEscalation: boolean;
}

export const FRONT_OFFICE_OWNER_ROUTING_RULES: FrontOfficeOwnerRoutingRule[] = [
  {
    id: "contracts",
    role: "contracts_agent",
    reason: "owner:contracts",
    patterns: [/договор|контракт|услови[ея]|подпис/i],
  },
  {
    id: "crm",
    role: "crm_agent",
    reason: "owner:crm",
    patterns: [
      /контрагент|crm|лид|реквизит|карточк|контакт(?!\s+по\s+задаче)|встреч/i,
    ],
  },
  {
    id: "agronomy",
    role: "agronomist",
    reason: "owner:agronomy",
    patterns: [/поле|техкарт|сезон|сзр|агроном|урож/i],
  },
  {
    id: "economy",
    role: "economist",
    reason: "owner:economy",
    patterns: [/финанс|план-факт|марж|бюджет|риск|cash/i],
  },
  {
    id: "monitoring",
    role: "monitoring",
    reason: "owner:monitoring",
    patterns: [/алерт|инцидент|авари|сбой|критич|монитор/i],
  },
  {
    id: "knowledge",
    role: "knowledge",
    reason: "owner:knowledge",
    patterns: [/регламент|политик|знан|документ/i],
  },
];

export const FRONT_OFFICE_CLASSIFICATION_RULES: FrontOfficeClassificationRule[] =
  [
    {
      id: "critical",
      classification: "escalation_signal",
      confidence: 0.88,
      reason: "classification:critical_signal_detected",
      needsEscalation: true,
      defaultOwnerRole: "monitoring",
      patterns: [/срочно|эскалац|критич|не работает|проблем|авари|зависло/i],
    },
    {
      id: "task",
      classification: "task_process",
      confidence: 0.82,
      reason: "classification:task_language_detected",
      needsEscalation: false,
      patterns: [/нужно|сделай|создай|поставь|поруч|в работу|заведи/i],
    },
    {
      id: "business",
      classification: "client_request",
      confidence: 0.78,
      reason: "classification:business_request_detected",
      needsEscalation: true,
      defaultOwnerRole: "crm_agent",
      patterns: [/контрагент|договор|сч[её]т|crm|контакт|реквизит|карточк|подпис/i],
    },
  ];

export function detectTargetOwnerRoleByPolicy(text: string): {
  role?: string;
  reason?: string;
} {
  for (const rule of FRONT_OFFICE_OWNER_ROUTING_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return { role: rule.role, reason: rule.reason };
    }
  }
  return {};
}

export function classifyFrontOfficeMessageByPolicy(
  text: string,
): FrontOfficePolicyClassification {
  const reasons: string[] = [];
  const owner = detectTargetOwnerRoleByPolicy(text);
  if (owner.reason) {
    reasons.push(owner.reason);
  }

  for (const rule of FRONT_OFFICE_CLASSIFICATION_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      reasons.push(rule.reason);
      const targetOwnerRole = owner.role ?? rule.defaultOwnerRole;
      return {
        classification: rule.classification,
        confidence: rule.confidence,
        reasons,
        targetOwnerRole,
        needsEscalation: targetOwnerRole ? true : rule.needsEscalation,
      };
    }
  }

  reasons.push("classification:no_process_signal_detected");
  return {
    classification: "free_chat",
    confidence: 0.65,
    reasons,
    targetOwnerRole: owner.role,
    needsEscalation: false,
  };
}
