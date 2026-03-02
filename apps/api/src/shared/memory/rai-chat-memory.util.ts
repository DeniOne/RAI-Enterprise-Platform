import type { RaiChatMemoryConfig } from "./rai-chat-memory.config";

const SECRET_PATTERNS: RegExp[] = [
  /BEGIN (RSA|EC|OPENSSH) PRIVATE KEY/i,
  /\bsk-[A-Za-z0-9]{16,}\b/, // common API key shape
  /\b(xox[baprs]-[A-Za-z0-9-]{10,})\b/, // Slack tokens
  /\bpassword\s*[:=]/i,
  /\bapi[_-]?key\s*[:=]/i,
  /\bsecret\s*[:=]/i,
  /\btoken\s*[:=]/i,
];

export function sanitizeChatTextForMemory(
  text: string,
  config: RaiChatMemoryConfig,
): { ok: true; value: string } | { ok: false; reason: string } {
  const raw = String(text ?? "");
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "empty" };

  for (const re of SECRET_PATTERNS) {
    if (re.test(trimmed)) return { ok: false, reason: "secret_detected" };
  }

  const normalized = trimmed.replace(/\s+/g, " ");
  const truncated =
    normalized.length > config.appendMaxChars
      ? normalized.slice(0, config.appendMaxChars)
      : normalized;

  return { ok: true, value: truncated };
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: () => T,
): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => resolve(fallback()), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(t);
        resolve(value);
      },
      (err) => {
        clearTimeout(t);
        reject(err);
      },
    );
  });
}

