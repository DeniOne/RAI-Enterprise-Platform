import Link from "next/link";
import { Card } from "@/components/ui";
import { frontOfficeServerApi } from "@/lib/api/front-office-server";

export default async function FrontOfficeTasksPage() {
  const response = await frontOfficeServerApi.tasks().catch(() => ({ data: [] }));
  const tasks = Array.isArray(response) ? response : response.data ?? [];

  return (
    <Card>
      <h2 className="text-lg font-medium text-gray-900">Задачи</h2>
      <p className="mt-1 text-sm text-gray-500">Мои текущие и ожидающие задачи в контуре Front-Office.</p>
      <div className="mt-6 space-y-3">
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500">Нет активных задач.</p>
        ) : (
          tasks.map((task: any) => (
            <Link
              key={task.id}
              href={`/front-office/tasks/${task.id}`}
              className="block rounded-2xl border border-black/5 p-4 transition hover:border-black/10 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{task.name}</p>
                  <p className="mt-1 text-xs text-gray-500">{task.field?.name ?? "Без поля"} • {task.status}</p>
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
