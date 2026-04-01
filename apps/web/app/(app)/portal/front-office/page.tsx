import Link from "next/link";
import { Card } from "@/components/ui";
import { ExternalFrontOfficeIntakeClient } from "@/components/front-office/ExternalFrontOfficeIntakeClient";
import { externalFrontOfficeServerApi } from "@/lib/api/front-office-server";
import { getExternalFrontOfficeThreadPath } from "@/lib/front-office-routes";

export default async function ExternalFrontOfficePage() {
  const threads = await externalFrontOfficeServerApi.threads().catch(() => []);

  return (
    <div className="space-y-6">
      <Card>
        <ExternalFrontOfficeIntakeClient />
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Мои диалоги</h2>
            <p className="mt-1 text-sm text-gray-500">
              Здесь отображаются только обращения, привязанные к вашему
              контрагенту.
            </p>
          </div>
          <span className="text-sm text-gray-500">{threads.length}</span>
        </div>
        {threads.length === 0 ? (
          <p className="text-sm text-gray-500">Активных диалогов пока нет.</p>
        ) : (
          <div className="space-y-3">
            {threads.map((thread: any) => (
              <Link
                key={thread.id}
                href={getExternalFrontOfficeThreadPath(thread.threadKey)}
                className="block rounded-2xl border border-black/5 p-4 transition hover:border-black/10 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
                    {thread.channel}
                  </p>
                  <span className="text-xs text-gray-500">
                    {thread.currentHandoffStatus ??
                      thread.currentClassification ??
                      "ОТКРЫТ"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-800">
                  {thread.lastMessagePreview ?? "Без текста"}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {thread.lastMessageAt
                    ? new Date(thread.lastMessageAt).toLocaleString("ru-RU")
                    : "Без активности"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
