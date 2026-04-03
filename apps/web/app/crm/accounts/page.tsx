import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Карточки контрагентов</h2>
          <p className="text-muted-foreground">Управление клиентами, партнёрами и регуляторными контрагентами.</p>
        </div>
        <Button asChild>
          <Link href="/crm/accounts/new">
            <Plus className="mr-2 h-4 w-4" /> Добавить карточку
          </Link>
        </Button>
      </div>

      <div className="rounded-md border bg-white p-6">
        <p>Таблица карточек будет подключена после настройки колонок и загрузки данных.</p>
      </div>
    </div>
  );
}
