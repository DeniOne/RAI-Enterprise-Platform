"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { externalFrontOfficeApi } from "@/lib/api/front-office";

interface ThreadMessage {
  id: string;
  channel?: "telegram" | "web_chat" | "internal";
  direction?: "inbound" | "outbound";
  messageText: string;
  createdAt?: string;
  deliveryStatus?: "RECEIVED" | "SENT" | "SKIPPED" | "FAILED";
  metadata?:
    | ({
        explainabilitySummary?: string | null;
        evidenceCount?: number;
      } & Record<string, unknown>)
    | null;
  evidence?: unknown[] | null;
}

const POLLING_INTERVAL_MS = 5000;
const POLLING_LIMIT = 120;

const DELIVERY_STATUS_LABEL: Record<
  NonNullable<ThreadMessage["deliveryStatus"]>,
  string
> = {
  RECEIVED: "получено",
  SENT: "доставлено",
  SKIPPED: "в thread-store",
  FAILED: "ошибка",
};

function mergeMessages(
  current: ThreadMessage[],
  incoming: ThreadMessage[],
): ThreadMessage[] {
  if (incoming.length === 0) {
    return current;
  }

  const existingById = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    existingById.set(message.id, {
      ...(existingById.get(message.id) ?? {}),
      ...message,
    });
  }

  return Array.from(existingById.values()).sort((left, right) => {
    const leftTs = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTs = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    if (leftTs === rightTs) {
      return left.id.localeCompare(right.id);
    }
    return leftTs - rightTs;
  });
}

export function ExternalFrontOfficeThreadClient({
  threadKey,
  initialMessages,
}: {
  threadKey: string;
  initialMessages: ThreadMessage[];
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initialMessages);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const messagesRef = useRef<ThreadMessage[]>(initialMessages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const lastMessageId = messages.at(-1)?.id;
    if (!lastMessageId) {
      return;
    }

    void externalFrontOfficeApi.markThreadRead(threadKey, lastMessageId).catch(() => {
      // Best-effort read marker. The thread remains usable even if it fails.
    });
  }, [messages, threadKey]);

  useEffect(() => {
    let disposed = false;

    const pullIncrementalMessages = async () => {
      const afterId = messagesRef.current.at(-1)?.id;
      try {
        const batch = (await externalFrontOfficeApi.getThreadMessages(
          threadKey,
          undefined,
          {
            afterId,
            limit: POLLING_LIMIT,
          },
        )) as ThreadMessage[];
        if (disposed || !Array.isArray(batch) || batch.length === 0) {
          return;
        }
        setMessages((current) => mergeMessages(current, batch));
      } catch {
        // Polling uses best-effort strategy; thread remains usable on temporary failures.
      }
    };

    const intervalId = setInterval(() => {
      void pullIncrementalMessages();
    }, POLLING_INTERVAL_MS);

    void pullIncrementalMessages();

    return () => {
      disposed = true;
      clearInterval(intervalId);
    };
  }, [threadKey]);

  const preparedMessages = useMemo(
    () => messages.map((message) => ({
      ...message,
      explainabilitySummary:
        typeof message.metadata?.explainabilitySummary === "string"
          ? message.metadata.explainabilitySummary
          : null,
      evidenceCount:
        typeof message.metadata?.evidenceCount === "number"
          ? message.metadata.evidenceCount
          : Array.isArray(message.evidence)
            ? message.evidence.length
            : 0,
    })),
    [messages],
  );

  const handleSubmit = () => {
    const nextMessage = replyText.trim();
    if (!nextMessage || isPending) {
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        const result = await externalFrontOfficeApi.replyToThread(
          threadKey,
          nextMessage,
        );
        const outboundMessage =
          result?.message ??
          ({
            id: result?.messageId ?? `local-${Date.now()}`,
            direction: "outbound",
            channel: result?.channel ?? "web_chat",
            messageText: nextMessage,
            createdAt: result?.createdAt ?? new Date().toISOString(),
            deliveryStatus: result?.deliveryStatus ?? "SKIPPED",
          } satisfies ThreadMessage);

        setMessages((current) => mergeMessages(current, [outboundMessage]));
        setReplyText("");
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Не удалось отправить сообщение.",
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {preparedMessages.length === 0 ? (
          <p className="text-sm text-gray-500">Сообщений пока нет.</p>
        ) : (
          preparedMessages.map((message) => (
            <div key={message.id} className="rounded-2xl border border-black/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400">
                  {message.direction}
                </p>
                <p className="text-xs text-gray-500">
                  {message.createdAt
                    ? new Date(message.createdAt).toLocaleString("ru-RU")
                    : message.channel ?? "web_chat"}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                {message.messageText}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span className="rounded-full border border-black/10 px-2 py-0.5 uppercase tracking-[0.1em]">
                  {message.channel ?? "web_chat"}
                </span>
                {message.deliveryStatus ? (
                  <span className="rounded-full border border-black/10 px-2 py-0.5">
                    {DELIVERY_STATUS_LABEL[message.deliveryStatus] ??
                      message.deliveryStatus}
                  </span>
                ) : null}
              </div>
              {message.explainabilitySummary || message.evidenceCount > 0 ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                  {message.explainabilitySummary ? (
                    <p className="text-xs text-amber-900">
                      {message.explainabilitySummary}
                    </p>
                  ) : null}
                  {message.evidenceCount > 0 ? (
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-amber-700">
                      Evidence: {message.evidenceCount}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="rounded-2xl border border-black/10 bg-gray-50/70 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
          Ответить в диалог
        </p>
        <textarea
          value={replyText}
          onChange={(event) => setReplyText(event.target.value)}
          rows={4}
          placeholder="Введите сообщение для отправки представителю хозяйства"
          className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/10"
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <div className="mt-3 flex justify-end">
          <Button onClick={handleSubmit} loading={isPending} disabled={!replyText.trim()}>
            Отправить
          </Button>
        </div>
      </div>
    </div>
  );
}
