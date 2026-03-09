import { Card } from "@/components/ui";
import { frontOfficeServerApi } from "@/lib/api/front-office-server";

export default async function FrontOfficeTaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [task, observationsResponse] = await Promise.all([
    frontOfficeServerApi.task(params.id).catch(() => null),
    frontOfficeServerApi.taskObservations(params.id).catch(() => ({ data: [] })),
  ]);
  const observations = Array.isArray(observationsResponse) ? observationsResponse : observationsResponse.data ?? [];

  if (!task) {
    return <Card><p className="text-sm text-gray-500">Задача не найдена.</p></Card>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <Card>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400">Задача</p>
        <h2 className="mt-3 text-2xl font-medium text-gray-900">{task.name}</h2>
        <div className="mt-6 space-y-3 text-sm text-gray-600">
          <p>Статус: {task.status}</p>
          <p>Поле: {task.field?.name ?? "n/a"}</p>
          <p>Сезон: {task.season?.year ?? "n/a"}</p>
          <p>Факт. ресурсы: {task.actualResources?.length ?? 0}</p>
        </div>
      </Card>
      <Card>
        <h3 className="text-lg font-medium text-gray-900">Evidence / Observations</h3>
        <div className="mt-4 space-y-3">
          {observations.length === 0 ? (
            <p className="text-sm text-gray-500">По задаче пока нет observation.</p>
          ) : (
            observations.map((item: any) => (
              <div key={item.id} className="rounded-2xl border border-black/5 p-4">
                <p className="text-sm font-medium text-gray-900">{item.type} • {item.intent}</p>
                <p className="mt-1 text-xs text-gray-500">{item.integrityStatus}</p>
                {item.content ? <p className="mt-2 text-sm text-gray-700">{item.content}</p> : null}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
