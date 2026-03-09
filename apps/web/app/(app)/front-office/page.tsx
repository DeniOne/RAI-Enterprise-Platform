import Link from 'next/link';
import { Card } from '@/components/ui';
import { frontOfficeServerApi } from '@/lib/api/front-office-server';

export default async function FrontOfficePage() {
    const overview = await frontOfficeServerApi.overview().catch(() => null);
    const counts = overview?.counts ?? { fields: 0, seasons: 0, tasks: 0, openDeviations: 0 };
    const tasks = overview?.tasks ?? [];
    const deviations = overview?.deviations ?? [];
    const recentSignals = overview?.recentSignals ?? [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <Card>
                    <h3 className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">Поля</h3>
                    <p className="text-4xl font-medium">{counts.fields}</p>
                </Card>
                <Card>
                    <h3 className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">Сезоны</h3>
                    <p className="text-4xl font-medium">{counts.seasons}</p>
                </Card>
                <Card>
                    <h3 className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">Мои задачи</h3>
                    <p className="text-4xl font-medium">{counts.tasks}</p>
                </Card>
                <Card>
                    <h3 className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-gray-400">Открытые отклонения</h3>
                    <p className="text-4xl font-medium">{counts.openDeviations}</p>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                <Card>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-medium text-gray-900">Операционные задачи</h2>
                        <Link href="/front-office/tasks" className="text-sm text-gray-500 hover:text-gray-900">Все задачи</Link>
                    </div>
                    {tasks.length === 0 ? (
                        <p className="text-sm text-gray-500">Нет активных задач.</p>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((task: any) => (
                                <Link
                                    key={task.id}
                                    href={`/front-office/tasks/${task.id}`}
                                    className="block rounded-2xl border border-black/5 p-4 transition hover:border-black/10 hover:bg-gray-50"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{task.name}</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                {task.field?.name ?? 'Поле не указано'} • сезон {task.season?.year ?? 'n/a'}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-black px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white">
                                            {task.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </Card>

                <div className="space-y-6">
                    <Card>
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-medium text-gray-900">Отклонения</h2>
                            <Link href="/front-office/deviations" className="text-sm text-gray-500 hover:text-gray-900">Реестр</Link>
                        </div>
                        {deviations.length === 0 ? (
                            <p className="text-sm text-gray-500">Нет открытых отклонений.</p>
                        ) : (
                            <div className="space-y-3">
                                {deviations.map((item: any) => (
                                    <div key={item.id} className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                                        <p className="text-sm font-medium text-gray-900">{item.deviationSummary}</p>
                                        <p className="mt-1 text-xs text-gray-500">{item.status} • {item.severity}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card>
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Последние сигналы</h2>
                        {recentSignals.length === 0 ? (
                            <p className="text-sm text-gray-500">Нет новых консультаций или обновлений контекста.</p>
                        ) : (
                            <div className="space-y-3">
                                {recentSignals.map((entry: any) => (
                                    <div key={entry.id} className="rounded-2xl border border-black/5 p-4">
                                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">{entry.action}</p>
                                        <p className="mt-2 text-sm text-gray-800">{entry.metadata?.messageText ?? 'Без текста'}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
