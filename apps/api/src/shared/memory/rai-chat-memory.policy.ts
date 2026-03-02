import type { IMemoryPolicy } from "./memory-policy.interface";

export const RaiChatMemoryPolicy: IMemoryPolicy = {
  id: "rai-chat-v0",
  name: "RAI Chat Memory Policy (v0)",
  shouldPersist: () => true,
  shouldRetrieve: () => true,
  calculateImportance: (content) => (content.length > 20 ? 0.8 : 0.6),
  calculateTTL: (type) => (type === "CONTEXT" ? 3600 : 86400 * 30),
};

