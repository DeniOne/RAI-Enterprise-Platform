import Link from "next/link";
import { Card } from "@/components/ui";
import { frontOfficeServerApi } from "@/lib/api/front-office-server";
import { formatStatusLabel } from "@/lib/ui-language";

export default async function FrontOfficeFieldsPage() {
  const fields = await frontOfficeServerApi.fields().catch(() => []);

  return (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Поля</h2>
          <p className="mt-1 text-sm text-gray-500">Реестр полей хозяйства и точка входа в рабочие карточки.</p>
        </div>
      </div>
      <div className="space-y-3">
        {fields.length === 0 ? (
          <p className="text-sm text-gray-500">Поля пока не найдены.</p>
        ) : (
          fields.map((field: any) => (
            <Link
              key={field.id}
              href={`/front-office/fields/${field.id}`}
              className="block rounded-2xl border border-black/5 p-4 transition hover:border-black/10 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{field.name}</p>
                  <p className="mt-1 text-xs text-gray-500">{field.area} га • {formatStatusLabel(field.status)}</p>
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
