import { Card } from "@/components/ui";
import { frontOfficeServerApi } from "@/lib/api/front-office-server";

export default async function FrontOfficeDeviationsPage() {
  const response = await frontOfficeServerApi.deviations().catch(() => ({ data: [] }));
  const deviations = response.data ?? [];

  return (
    <Card>
      <h2 className="text-lg font-medium text-gray-900">Отклонения</h2>
      <p className="mt-1 text-sm text-gray-500">Открытые и зафиксированные deviation review в контуре Front-Office.</p>
      <div className="mt-6 space-y-3">
        {deviations.length === 0 ? (
          <p className="text-sm text-gray-500">Отклонения не найдены.</p>
        ) : (
          deviations.map((item: any) => (
            <div key={item.id} className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
              <p className="text-sm font-medium text-gray-900">{item.deviationSummary}</p>
              <p className="mt-1 text-xs text-gray-500">{item.status} • severity {item.severity}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
