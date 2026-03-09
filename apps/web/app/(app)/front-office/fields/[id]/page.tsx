import { Card } from "@/components/ui";
import { frontOfficeServerApi } from "@/lib/api/front-office-server";

export default async function FrontOfficeFieldDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const field = await frontOfficeServerApi.field(params.id).catch(() => null);

  if (!field) {
    return <Card><p className="text-sm text-gray-500">Поле не найдено.</p></Card>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400">Карточка поля</p>
        <h2 className="mt-3 text-2xl font-medium text-gray-900">{field.name}</h2>
        <div className="mt-6 space-y-3 text-sm text-gray-600">
          <p>Площадь: {field.area} га</p>
          <p>Статус: {field.status}</p>
          <p>Хозяйство: {field.client?.name ?? "Не указано"}</p>
        </div>
      </Card>
      <Card>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400">Контекст</p>
        <p className="mt-3 text-sm text-gray-600">
          На этом этапе карточка поля работает как read-model hub. Дальше сюда подключаются сезоны, задачи, evidence, консультации и история.
        </p>
      </Card>
    </div>
  );
}
