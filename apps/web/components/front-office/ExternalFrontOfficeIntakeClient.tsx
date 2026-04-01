"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { externalFrontOfficeApi } from "@/lib/api/front-office";

export function ExternalFrontOfficeIntakeClient() {
  const router = useRouter();
  const [messageText, setMessageText] = useState("");
  const [threadExternalId, setThreadExternalId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isPending) {
      return;
    }

    startTransition(async () => {
      setError(null);
      try {
        await externalFrontOfficeApi.intakeMessage({
          messageText: trimmedMessage,
          threadExternalId: threadExternalId.trim() || undefined,
          dialogExternalId: threadExternalId.trim() || undefined,
        });
        setMessageText("");
        setThreadExternalId("");
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Не удалось отправить новое обращение.",
        );
      }
    });
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-gray-50/70 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
        Новое обращение
      </p>
      <p className="mt-2 text-sm text-gray-600">
        Сообщение будет создано как inbound в канале web_chat.
      </p>
      <input
        value={threadExternalId}
        onChange={(event) => setThreadExternalId(event.target.value)}
        placeholder="ID диалога (опционально)"
        className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/10"
      />
      <textarea
        value={messageText}
        onChange={(event) => setMessageText(event.target.value)}
        rows={4}
        placeholder="Опишите вопрос или проблему"
        className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-black/20 focus:ring-2 focus:ring-black/10"
      />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      <div className="mt-3 flex justify-end">
        <Button onClick={handleSubmit} loading={isPending} disabled={!messageText.trim()}>
          Отправить inbound
        </Button>
      </div>
    </div>
  );
}
