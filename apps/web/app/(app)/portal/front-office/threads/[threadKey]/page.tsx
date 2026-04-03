import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { ExternalFrontOfficeThreadClient } from "@/components/front-office/ExternalFrontOfficeThreadClient";
import { externalFrontOfficeServerApi } from "@/lib/api/front-office-server";
import { EXTERNAL_FRONT_OFFICE_BASE_PATH } from "@/lib/front-office-routes";
import { formatStatusLabel } from "@/lib/ui-language";

export default async function ExternalFrontOfficeThreadPage({
  params,
}: {
  params: Promise<{ threadKey: string }>;
}) {
  const { threadKey } = await params;
  const decodedThreadKey = decodeURIComponent(threadKey);
  const data = await externalFrontOfficeServerApi
    .thread(decodedThreadKey)
    .catch(() => null);

  if (!data?.thread) {
    notFound();
  }

  const thread = data.thread;
  const messages = data.messages ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
            Диалог
          </p>
          <h1 className="mt-2 text-2xl font-medium text-gray-900">
            {thread.threadKey}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {thread.channel} • {formatStatusLabel(thread.currentHandoffStatus ?? thread.currentClassification ?? "OPEN")}
          </p>
        </div>
        <Link
          href={EXTERNAL_FRONT_OFFICE_BASE_PATH}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Назад к списку
        </Link>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-medium text-gray-900">Сообщения</h2>
        <ExternalFrontOfficeThreadClient
          threadKey={decodedThreadKey}
          initialMessages={messages}
        />
      </Card>
    </div>
  );
}
