export interface RaiChatMemoryConfig {
  recallLimit: number;
  minSimilarity: number;
  recallTimeoutMs: number;
  appendMaxChars: number;
}

function readInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function readFloat(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function getRaiChatMemoryConfig(): RaiChatMemoryConfig {
  return {
    recallLimit: readInt(process.env.RAI_CHAT_MEMORY_TOP_K, 3),
    minSimilarity: readFloat(process.env.RAI_CHAT_MEMORY_MIN_SIMILARITY, 0.7),
    recallTimeoutMs: readInt(process.env.RAI_CHAT_MEMORY_RECALL_TIMEOUT_MS, 150),
    appendMaxChars: readInt(process.env.RAI_CHAT_MEMORY_APPEND_MAX_CHARS, 800),
  };
}

