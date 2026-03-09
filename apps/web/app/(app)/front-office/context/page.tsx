import { Card } from "@/components/ui";
import { frontOfficeServerApi } from "@/lib/api/front-office-server";

export default async function FrontOfficeContextPage() {
  const [consultations, contextUpdates] = await Promise.all([
    frontOfficeServerApi.consultations().catch(() => []),
    frontOfficeServerApi.contextUpdates().catch(() => []),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-lg font-medium text-gray-900">Консультации</h2>
        <p className="mt-1 text-sm text-gray-500">Object-anchored consultation requests, зафиксированные через Front-Office.</p>
        <div className="mt-6 space-y-3">
          {consultations.length === 0 ? (
            <p className="text-sm text-gray-500">Консультации пока не зафиксированы.</p>
          ) : (
            consultations.map((entry: any) => (
              <div key={entry.id} className="rounded-2xl border border-black/5 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">{entry.action}</p>
                <p className="mt-2 text-sm text-gray-800">{entry.metadata?.messageText ?? "Без текста"}</p>
              </div>
            ))
          )}
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-medium text-gray-900">Обновления контекста</h2>
        <p className="mt-1 text-sm text-gray-500">Накопление operational memory по хозяйству, полям и сезонам.</p>
        <div className="mt-6 space-y-3">
          {contextUpdates.length === 0 ? (
            <p className="text-sm text-gray-500">Обновления контекста пока не зафиксированы.</p>
          ) : (
            contextUpdates.map((entry: any) => (
              <div key={entry.id} className="rounded-2xl border border-black/5 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">{entry.action}</p>
                <p className="mt-2 text-sm text-gray-800">{entry.metadata?.messageText ?? "Без текста"}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
