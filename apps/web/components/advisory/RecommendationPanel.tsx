"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui";

export interface AdvisoryRecommendation {
  traceId: string;
  signalType: "VISION" | "SATELLITE" | "OPERATION";
  recommendation: "ALLOW" | "REVIEW" | "BLOCK";
  confidence: number;
  explainability: {
    traceId: string;
    confidence: number;
    why: string;
    factors: Array<{
      name: string;
      value: number;
      direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    }>;
  };
  createdAt: string;
  status: "PENDING";
}

interface RecommendationPanelProps {
  initialRecommendations: AdvisoryRecommendation[];
}

export function RecommendationPanel({ initialRecommendations }: RecommendationPanelProps) {
  const [items, setItems] = useState<AdvisoryRecommendation[]>(initialRecommendations);
  const [busyTraceId, setBusyTraceId] = useState<string | null>(null);
  const [reasonByTraceId, setReasonByTraceId] = useState<Record<string, string>>({});
  const [outcomeByTraceId, setOutcomeByTraceId] = useState<Record<string, string>>({});

  const isEmpty = useMemo(() => items.length === 0, [items.length]);

  async function accept(traceId: string) {
    setBusyTraceId(traceId);
    try {
      const response = await fetch(`/api/advisory/recommendations/${traceId}/accept`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("accept failed");
      }
      setItems((prev) => prev.filter((item) => item.traceId !== traceId));
    } catch (error) {
      console.error("Failed to accept advisory", error);
      alert("Не удалось подтвердить рекомендацию.");
    } finally {
      setBusyTraceId(null);
    }
  }

  async function reject(traceId: string) {
    setBusyTraceId(traceId);
    const reason = reasonByTraceId[traceId]?.trim();
    const outcome = outcomeByTraceId[traceId]?.trim();

    try {
      const rejectResponse = await fetch(`/api/advisory/recommendations/${traceId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reason ? { reason } : {}),
      });
      if (!rejectResponse.ok) {
        throw new Error("reject failed");
      }

      if (reason) {
        const feedbackResponse = await fetch(`/api/advisory/recommendations/${traceId}/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason, outcome: outcome || undefined }),
        });
        if (!feedbackResponse.ok) {
          throw new Error("feedback failed");
        }
      }

      setItems((prev) => prev.filter((item) => item.traceId !== traceId));
    } catch (error) {
      console.error("Failed to reject advisory", error);
      alert("Не удалось отклонить рекомендацию.");
    } finally {
      setBusyTraceId(null);
    }
  }

  return (
    <Card className="rounded-2xl">
      <h2 className="text-xl font-medium mb-4">Рекомендации Advisory</h2>

      {isEmpty ? (
        <p className="text-sm text-gray-500">Нет активных рекомендаций.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isBusy = busyTraceId === item.traceId;
            return (
              <div key={item.traceId} className="border border-black/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.recommendation} · {item.signalType}</p>
                    <p className="text-xs text-gray-500">traceId: {item.traceId}</p>
                  </div>
                  <p className="text-sm">{(item.confidence * 100).toFixed(1)}%</p>
                </div>

                <p className="text-sm text-gray-700">{item.explainability.why}</p>

                <div className="flex flex-wrap gap-2">
                  {item.explainability.factors.slice(0, 4).map((factor) => (
                    <span
                      key={`${item.traceId}-${factor.name}`}
                      className="text-xs px-2 py-1 rounded-full border border-black/10 bg-white"
                    >
                      {factor.name}: {factor.value}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    className="px-3 py-2 rounded-xl border border-black/10 text-sm"
                    placeholder="Причина отклонения (опционально)"
                    value={reasonByTraceId[item.traceId] || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setReasonByTraceId((prev) => ({ ...prev, [item.traceId]: value }));
                    }}
                    disabled={isBusy}
                  />
                  <input
                    className="px-3 py-2 rounded-xl border border-black/10 text-sm"
                    placeholder="Post-fact outcome (опционально)"
                    value={outcomeByTraceId[item.traceId] || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setOutcomeByTraceId((prev) => ({ ...prev, [item.traceId]: value }));
                    }}
                    disabled={isBusy}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium disabled:opacity-60"
                    onClick={() => accept(item.traceId)}
                    disabled={isBusy}
                  >
                    Принять
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl border border-black/10 text-sm font-medium disabled:opacity-60"
                    onClick={() => reject(item.traceId)}
                    disabled={isBusy}
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
