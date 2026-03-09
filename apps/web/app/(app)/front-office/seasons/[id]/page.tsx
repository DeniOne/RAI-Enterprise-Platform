import { Card } from "@/components/ui";
import { frontOfficeServerApi } from "@/lib/api/front-office-server";

export default async function FrontOfficeSeasonDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [season, history] = await Promise.all([
    frontOfficeServerApi.season(params.id).catch(() => null),
    frontOfficeServerApi.seasonHistory(params.id).catch(() => []),
  ]);

  if (!season) {
    return <Card><p className="text-sm text-gray-500">Сезон не найден.</p></Card>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400">Сезон</p>
        <h2 className="mt-3 text-2xl font-medium text-gray-900">Сезон {season.year}</h2>
        <div className="mt-6 space-y-3 text-sm text-gray-600">
          <p>Статус: {season.status}</p>
          <p>Поле: {season.fieldId ?? "Не указано"}</p>
          <p>Start date: {season.startDate ? new Date(season.startDate).toLocaleDateString("ru-RU") : "n/a"}</p>
        </div>
      </Card>
      <Card>
        <h3 className="text-lg font-medium text-gray-900">История стадий</h3>
        <div className="mt-4 space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">История стадий пока отсутствует.</p>
          ) : (
            history.map((entry: any, index: number) => (
              <div key={entry.id ?? index} className="rounded-2xl border border-black/5 p-4">
                <p className="text-sm font-medium text-gray-900">{entry.stageId ?? entry.toStageId ?? "Stage"}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {entry.createdAt ? new Date(entry.createdAt).toLocaleString("ru-RU") : "n/a"}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
