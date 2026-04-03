import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: accountId } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/crm/accounts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Карточка контрагента: {accountId}</h1>
          <p className="text-muted-foreground">Статус: Активно | Тип: Сельхозпроизводитель</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="contacts">Контакты</TabsTrigger>
          <TabsTrigger value="interactions">Взаимодействия</TabsTrigger>
          <TabsTrigger value="commitments">Обязательства</TabsTrigger>
          <TabsTrigger value="risk">Риски и право</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Профиль</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Юрисдикция</p>
                  <p>Россия, Краснодарский край</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">ИНН</p>
                  <p>2310031234</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Категория риска</p>
                  <p className="font-medium text-green-600">Низкая</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Стратегическая ценность</p>
                  <p className="font-medium text-blue-600">A</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardContent className="pt-6">
              <p>Список контактов будет показан после подключения данных по контрагенту.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions">
          <Card>
            <CardContent className="pt-6">
              <p>Журнал взаимодействий появится после подключения истории коммуникаций.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
