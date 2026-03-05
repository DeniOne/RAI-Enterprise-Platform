import { Injectable, Optional } from "@nestjs/common";
import { IncidentOpsService } from "../incident-ops.service";
import { SystemIncidentType } from "@rai/prisma-client";

/** Паттерны PII для маскировки выхода LLM (SECURITY_CANON, RAI_AI_SYSTEM_ARCHITECTURE §10.1). */
const PATTERNS: Array<{ regex: RegExp; mask: string }> = [
  { regex: /\b\d{10}\b/g, mask: "[ИНН СКРЫТ]" },
  { regex: /\b\d{12}\b/g, mask: "[ИНН СКРЫТ]" },
  { regex: /\b40[0-9]\d{17}\b/g, mask: "***" },
  { regex: /[\w.-]+@[\w.-]+\.\w+/g, mask: "[HIDDEN_EMAIL]" },
  { regex: /\+7\d{10}\b/g, mask: "[ТЕЛЕФОН СКРЫТ]" },
  { regex: /\b8\d{10}\b/g, mask: "[ТЕЛЕФОН СКРЫТ]" },
];

export interface MaskContext {
  companyId?: string | null;
  traceId?: string | null;
}

@Injectable()
export class SensitiveDataFilterService {
  constructor(
    @Optional() private readonly incidentOps: IncidentOpsService | null,
  ) {}

  /**
   * Заменяет PII в тексте на маски. Если передан context и произошла замена — пишет инцидент PII_LEAK (fire-and-forget).
   */
  mask(text: string, context?: MaskContext): string {
    if (!text || typeof text !== "string") return text;
    let out = text;
    for (const { regex, mask } of PATTERNS) {
      out = out.replace(regex, mask);
    }
    if (context && this.incidentOps && out !== text) {
      this.incidentOps.logIncident({
        companyId: context.companyId ?? null,
        traceId: context.traceId ?? null,
        incidentType: SystemIncidentType.PII_LEAK,
        severity: "MEDIUM",
        details: { snippetLength: text.length },
      });
    }
    return out;
  }
}
