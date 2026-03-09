import { Card } from "@/components/ui";
import { frontOfficeServerApi } from "@/lib/api/front-office-server";

export default async function FrontOfficeTechMapDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const techMap = await frontOfficeServerApi.techMap(params.id).catch(() => null);

  if (!techMap) {
    return <Card><p className="text-sm text-gray-500">Техкарта не найдена.</p></Card>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400">Техкарта</p>
        <h2 className="mt-3 text-2xl font-medium text-gray-900">#{techMap.id.slice(-6)}</h2>
        <div className="mt-6 space-y-3 text-sm text-gray-600">
          <p>Статус: {techMap.status}</p>
          <p>Версия: {techMap.version}</p>
          <p>Season: {techMap.seasonId ?? "n/a"}</p>
        </div>
      </Card>
      <Card>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400">Контроль</p>
        <p className="mt-3 text-sm text-gray-600">
          Карточка уже показывает реальный FSM state. Следующий этап — вывести approve/transition surface и связанные операции.
        </p>
      </Card>
    </div>
  );
}
