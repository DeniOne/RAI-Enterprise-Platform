import Link from "next/link";
import { Card } from "@/components/ui";
import { frontOfficeServerApi } from "@/lib/api/front-office-server";

export default async function FrontOfficeTechMapsPage() {
  const techMaps = await frontOfficeServerApi.techMaps().catch(() => []);

  return (
    <Card>
      <h2 className="text-lg font-medium text-gray-900">Техкарты</h2>
      <p className="mt-1 text-sm text-gray-500">Read-model техкарт и их FSM статусов для хозяйства.</p>
      <div className="mt-6 space-y-3">
        {techMaps.length === 0 ? (
          <p className="text-sm text-gray-500">Техкарты не найдены.</p>
        ) : (
          techMaps.map((item: any) => (
            <Link
              key={item.id}
              href={`/front-office/tech-maps/${item.id}`}
              className="block rounded-2xl border border-black/5 p-4 transition hover:border-black/10 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Техкарта #{item.id.slice(-6)}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.status} • версия {item.version}</p>
                </div>
                <span className="text-xs text-gray-400">Открыть</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </Card>
  );
}
