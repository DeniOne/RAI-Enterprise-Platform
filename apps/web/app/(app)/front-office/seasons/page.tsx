import Link from "next/link";
import { Card } from "@/components/ui";
import { frontOfficeServerApi } from "@/lib/api/front-office-server";

export default async function FrontOfficeSeasonsPage() {
  const seasons = await frontOfficeServerApi.seasons().catch(() => []);

  return (
    <Card>
      <h2 className="text-lg font-medium text-gray-900">Сезоны</h2>
      <p className="mt-1 text-sm text-gray-500">Текущие и исторические сезоны с привязкой к полю и orchestrator history.</p>
      <div className="mt-6 space-y-3">
        {seasons.length === 0 ? (
          <p className="text-sm text-gray-500">Сезоны не найдены.</p>
        ) : (
          seasons.map((season: any) => (
            <Link
              key={season.id}
              href={`/front-office/seasons/${season.id}`}
              className="block rounded-2xl border border-black/5 p-4 transition hover:border-black/10 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Сезон {season.year}</p>
                  <p className="mt-1 text-xs text-gray-500">{season.status}</p>
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
