import {
  classifyFrontOfficeMessageByPolicy,
  FrontOfficeThreadClassification,
} from "./front-office-routing.policy";

export interface FrontOfficeAnchorCandidates {
  farmRefs: string[];
  fieldIds: string[];
  seasonIds: string[];
  taskIds: string[];
}

export interface ClassifiedFrontOfficeMessage {
  classification: FrontOfficeThreadClassification;
  confidence: number;
  reasons: string[];
  targetOwnerRole?: string;
  needsEscalation: boolean;
  anchorCandidates: FrontOfficeAnchorCandidates;
  mustClarifications: string[];
  handoffSummary: string;
}

export function buildThreadKey(params: {
  companyId: string;
  channel: "telegram" | "web_chat" | "internal";
  threadExternalId?: string;
  dialogExternalId?: string;
  senderExternalId?: string;
}): string {
  return [
    params.companyId,
    params.channel,
    params.threadExternalId ??
      params.dialogExternalId ??
      params.senderExternalId ??
      "unknown",
  ].join(":");
}

function collectMatches(text: string, pattern: RegExp): string[] {
  const values = new Set<string>();
  for (const match of text.matchAll(pattern)) {
    const value = match[1]?.trim();
    if (value) {
      values.add(value);
    }
  }
  return Array.from(values);
}

function detectAnchorCandidates(text: string): FrontOfficeAnchorCandidates {
  return {
    farmRefs: collectMatches(
      text,
      /(?:farm|farmRef|хозяйств(?:о|а)?|клиент)\s*[:=]?\s*([A-Za-z0-9_-]+)/gi,
    ),
    fieldIds: collectMatches(
      text,
      /(?:field|fieldId|поле)\s*[:=]?\s*([A-Za-z0-9_-]+)/gi,
    ),
    seasonIds: collectMatches(
      text,
      /(?:season|seasonId|сезон)\s*[:=]?\s*([A-Za-z0-9_-]+)/gi,
    ),
    taskIds: collectMatches(
      text,
      /(?:task|taskId|задач[аеи])\s*[:=]?\s*([A-Za-z0-9_-]+)/gi,
    ),
  };
}

function suggestMustClarifications(input: {
  classification: FrontOfficeThreadClassification;
  confidence: number;
  anchorCandidates: FrontOfficeAnchorCandidates;
}): string[] {
  const mustClarifications = new Set<string>();
  if (input.confidence < 0.72) {
    mustClarifications.add("CONFIRM_INTENT");
  }

  if (input.classification === "task_process") {
    if (
      input.anchorCandidates.fieldIds.length === 0 &&
      input.anchorCandidates.taskIds.length === 0
    ) {
      mustClarifications.add("LINK_FIELD_OR_TASK");
    }
    if (input.anchorCandidates.seasonIds.length === 0) {
      mustClarifications.add("LINK_SEASON");
    }
  }

  if (
    input.classification === "client_request" &&
    input.anchorCandidates.fieldIds.length === 0 &&
    input.anchorCandidates.taskIds.length === 0 &&
    input.anchorCandidates.seasonIds.length === 0 &&
    input.anchorCandidates.farmRefs.length === 0
  ) {
    mustClarifications.add("LINK_OBJECT");
  }

  return Array.from(mustClarifications);
}

function buildHandoffSummary(params: {
  messageText: string;
  classification: FrontOfficeThreadClassification;
  targetOwnerRole?: string;
  anchorCandidates: FrontOfficeAnchorCandidates;
}): string {
  const anchorSummary = [
    params.anchorCandidates.farmRefs[0]
      ? `farm=${params.anchorCandidates.farmRefs[0]}`
      : null,
    params.anchorCandidates.fieldIds[0]
      ? `field=${params.anchorCandidates.fieldIds[0]}`
      : null,
    params.anchorCandidates.seasonIds[0]
      ? `season=${params.anchorCandidates.seasonIds[0]}`
      : null,
    params.anchorCandidates.taskIds[0]
      ? `task=${params.anchorCandidates.taskIds[0]}`
      : null,
  ]
    .filter(Boolean)
    .join(" ");
  const messagePreview = params.messageText.trim().slice(0, 240);
  return [
    `classification=${params.classification}`,
    params.targetOwnerRole ? `owner=${params.targetOwnerRole}` : null,
    anchorSummary || null,
    messagePreview,
  ]
    .filter(Boolean)
    .join(" | ");
}

export function classifyFrontOfficeMessage(text: string): ClassifiedFrontOfficeMessage {
  const policyClassification = classifyFrontOfficeMessageByPolicy(text);
  const anchorCandidates = detectAnchorCandidates(text);

  return {
    classification: policyClassification.classification,
    confidence: policyClassification.confidence,
    targetOwnerRole: policyClassification.targetOwnerRole,
    needsEscalation: policyClassification.needsEscalation,
    reasons: policyClassification.reasons,
    anchorCandidates,
    mustClarifications: suggestMustClarifications({
      classification: policyClassification.classification,
      confidence: policyClassification.confidence,
      anchorCandidates,
    }),
    handoffSummary: buildHandoffSummary({
      messageText: text,
      classification: policyClassification.classification,
      targetOwnerRole: policyClassification.targetOwnerRole,
      anchorCandidates,
    }),
  };
}
