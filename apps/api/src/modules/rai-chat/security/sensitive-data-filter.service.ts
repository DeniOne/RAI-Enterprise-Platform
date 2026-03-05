import { Injectable } from "@nestjs/common";

/** Паттерны PII для маскировки выхода LLM (SECURITY_CANON, RAI_AI_SYSTEM_ARCHITECTURE §10.1). */
const PATTERNS: Array<{ regex: RegExp; mask: string }> = [
  { regex: /\b\d{10}\b/g, mask: "[ИНН СКРЫТ]" },
  { regex: /\b\d{12}\b/g, mask: "[ИНН СКРЫТ]" },
  { regex: /\b40[0-9]\d{17}\b/g, mask: "***" },
  { regex: /[\w.-]+@[\w.-]+\.\w+/g, mask: "[HIDDEN_EMAIL]" },
  { regex: /\+7\d{10}\b/g, mask: "[ТЕЛЕФОН СКРЫТ]" },
  { regex: /\b8\d{10}\b/g, mask: "[ТЕЛЕФОН СКРЫТ]" },
];

@Injectable()
export class SensitiveDataFilterService {
  /**
   * Заменяет PII в тексте на маски. Порядок важен: более специфичные паттерны (ИНН 10/12, р/с) до общих.
   */
  mask(text: string): string {
    if (!text || typeof text !== "string") return text;
    let out = text;
    for (const { regex, mask } of PATTERNS) {
      out = out.replace(regex, mask);
    }
    return out;
  }
}
