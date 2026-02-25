import { AuthorityContextType } from '@/core/governance/AuthorityContext';

export type TraceStatus = 'AVAILABLE' | 'PENDING';

export const hasForensicAuthority = (authority: AuthorityContextType): boolean =>
    authority.canSign || authority.canOverride;

export const shouldDisableLedgerVerify = (traceStatus: TraceStatus, traceId?: string): boolean =>
    traceStatus === 'PENDING' || !traceId;

export const hasExplainabilityPolicyViolation = (isAiAuthor: boolean, hasExplainability: boolean): boolean =>
    isAiAuthor && !hasExplainability;

export const hasSurfaceContractViolation = (
    explainability?: {
        confidence?: number;
        factors?: Array<unknown>;
        verdict?: string;
    },
    traceStatus?: TraceStatus,
): boolean => {
    if (!explainability) return true;
    const confidenceValid = typeof explainability.confidence === 'number' && explainability.confidence >= 0 && explainability.confidence <= 1;
    const isInsufficient = explainability.verdict === 'INSUFFICIENT_EVIDENCE';
    const factorsValid = isInsufficient || (Array.isArray(explainability.factors) && explainability.factors.length > 0);
    const traceStateValid = traceStatus === 'AVAILABLE' || traceStatus === 'PENDING';
    return !confidenceValid || !factorsValid || !traceStateValid;
};
