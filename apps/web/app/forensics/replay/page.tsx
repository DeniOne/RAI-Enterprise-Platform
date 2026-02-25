'use client';

import React, { useMemo, useState } from 'react';
import { useSessionIntegrity } from '@/shared/hooks/useSessionIntegrity';

const safeParseJson = (raw: string): Record<string, unknown> | null => {
    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
        return parsed as Record<string, unknown>;
    } catch {
        return null;
    }
};

export default function ReplayPage() {
    const { traceId, integrityStatus, mismatch, verifyReplay } = useSessionIntegrity();
    const [recordedHash, setRecordedHash] = useState(mismatch?.expectedHash ?? '');
    const [payloadRaw, setPayloadRaw] = useState('{\n  "traceId": "' + traceId + '"\n}');
    const [busy, setBusy] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const parsedPayload = useMemo(() => safeParseJson(payloadRaw), [payloadRaw]);

    const onVerify = async () => {
        setLocalError(null);
        if (!recordedHash.trim()) {
            setLocalError('Recorded hash is required.');
            return;
        }
        if (!parsedPayload) {
            setLocalError('Payload must be a valid JSON object.');
            return;
        }

        setBusy(true);
        try {
            await verifyReplay(recordedHash.trim(), parsedPayload);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6 p-8">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Forensic Trace Replay</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Deterministic replay verification against recorded ledger hash.
                </p>
            </div>

            <div className="rounded-xl border border-gray-300 bg-white p-4 font-mono text-xs text-gray-800">
                <div>TRACE_ID: {traceId}</div>
                <div>INTEGRITY_STATUS: {integrityStatus}</div>
                <div>MISMATCH_EXPECTED: {mismatch?.expectedHash ?? 'N/A'}</div>
                <div>MISMATCH_ACTUAL: {mismatch?.actualHash ?? 'N/A'}</div>
            </div>

            <div className="space-y-4 rounded-xl border border-gray-300 bg-white p-4">
                <label className="block text-xs font-medium text-gray-700">
                    Recorded Hash
                    <input
                        value={recordedHash}
                        onChange={(e) => setRecordedHash(e.target.value)}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs"
                        placeholder="64-char SHA-256 hash"
                    />
                </label>

                <label className="block text-xs font-medium text-gray-700">
                    Replay Payload (JSON object)
                    <textarea
                        value={payloadRaw}
                        onChange={(e) => setPayloadRaw(e.target.value)}
                        rows={12}
                        className="mt-1 w-full rounded border border-gray-300 px-3 py-2 font-mono text-xs"
                    />
                </label>

                {localError && <p className="text-xs text-red-700">{localError}</p>}

                <button
                    onClick={onVerify}
                    disabled={busy}
                    className="rounded border border-gray-800 bg-gray-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
                >
                    {busy ? 'Verifying...' : 'Verify Replay'}
                </button>
            </div>
        </div>
    );
}

