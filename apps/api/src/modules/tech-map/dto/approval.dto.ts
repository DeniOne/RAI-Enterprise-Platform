import { z } from "zod";

export const approverRoleSchema = z.enum([
  "AGRONOMIST",
  "DIRECTOR",
  "LEGAL",
  "FINANCE",
]);

export const approvalDecisionSchema = z.enum(["APPROVED", "REJECTED"]);

export const ApprovalCreateDtoSchema = z.object({
  approverRole: approverRoleSchema,
  approverUserId: z.string().min(1).max(128).optional(),
  companyId: z.string().min(1).max(128),
});

export const ApprovalDecisionDtoSchema = z.object({
  decision: approvalDecisionSchema,
  comment: z.string().max(1000).optional(),
  approverUserId: z.string().min(1).max(128),
});

export type ApprovalCreateDto = z.infer<typeof ApprovalCreateDtoSchema>;
export type ApprovalDecisionDto = z.infer<typeof ApprovalDecisionDtoSchema>;
