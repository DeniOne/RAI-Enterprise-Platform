import mitt from 'mitt';

type Events = {
    'GOVERNANCE_ACTION_INITIATED': { traceId: string; action: string };
    'DEVIATION_DETECTED': { riskLevel: 'R1' | 'R2' | 'R3' | 'R4'; message: string };
    'LEDGER_MISMATCH': { expectedHash: string; actualHash: string };
    'UI_FREEZE_TRIGGERED': { reason: string };
};

export const eventBus = mitt<Events>();
