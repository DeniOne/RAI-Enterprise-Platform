export interface AgentLifecycleHistoryItemDto {
  role: string;
  state: "FROZEN" | "RETIRED";
  reason: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  clearedAt: string | null;
  createdByUserId: string | null;
  clearedByUserId: string | null;
}
