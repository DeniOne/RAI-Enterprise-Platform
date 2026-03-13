"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { externalFrontOfficeApi } from "@/lib/api/front-office";

interface ThreadMessage {
  id: string;
  channel?: string;
  direction?: "inbound" | "outbound";
  messageText: string;
  createdAt?: string;
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

  useEffect(() => {
    const lastMessageId = messages.at(-1)?.id;
    if (!lastMessageId) {
      return;
    }

    void externalFrontOfficeApi.markThreadRead(threadKey, lastMessageId).catch(() => {
      // Best-effort read marker. The thread remains usable even if it fails.
    });
  }, [messages, threadKey]);

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
            id: `local-${Date.now()}`,
            direction: "outbound",
            channel: "telegram",
            messageText: nextMessage,
            createdAt: new Date().toISOString(),
          } satisfies ThreadMessage);

        setMessages((current) => [...current, outboundMessage]);
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
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">Сообщений пока нет.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="rounded-2xl border border-black/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.16em] text-gray-400">
                  {message.direction}
                </p>
                <p className="text-xs text-gray-500">
                  {message.createdAt
                    ? new Date(message.createdAt).toLocaleString("ru-RU")
                    : message.channel ?? "telegram"}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                {message.messageText}
              </p>
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
