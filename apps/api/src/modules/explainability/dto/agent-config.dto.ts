import { z } from "zod";

const capabilitiesSchema = z.array(z.string()).default([]);

export const UpsertAgentConfigDtoSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  systemPrompt: z.string(),
  llmModel: z.string().min(1),
  maxTokens: z.number().int().positive(),
  isActive: z.boolean().optional().default(true),
  capabilities: z.union([z.array(z.string()), z.undefined()]).transform((v) => (v ?? [])),
});
export type UpsertAgentConfigDto = z.infer<typeof UpsertAgentConfigDtoSchema>;

export interface AgentConfigItemDto {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  llmModel: string;
  maxTokens: number;
  isActive: boolean;
  companyId: string | null;
  capabilities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentConfigsResponseDto {
  global: AgentConfigItemDto[];
  tenantOverrides: AgentConfigItemDto[];
}
