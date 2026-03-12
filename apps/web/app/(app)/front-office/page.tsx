import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui';
import { frontOfficeServerApi } from '@/lib/api/front-office-server';
import { getUserData } from '@/lib/api/auth-server';
import { EXTERNAL_FRONT_OFFICE_BASE_PATH } from '@/lib/front-office-routes';

export default async function FrontOfficePage() {
    const user = await getUserData();
    const { role: viewerRole } = user ?? {};
    const isExternalFrontOffice = viewerRole === 'FRONT_OFFICE_USER';

    if (isExternalFrontOffice) {
        redirect(EXTERNAL_FRONT_OFFICE_BASE_PATH);
    }

    const overview = await frontOfficeServerApi.overview().catch(() => null);
    const queues = await frontOfficeServerApi.queues().catch(() => null);
    const threads = await frontOfficeServerApi.threads().catch(() => []);
    const handoffs = await frontOfficeServerApi.handoffs().catch(() => []);
    const counts = overview?.counts ?? { fields: 0, seasons: 0, tasks: 0, openDeviations: 0 };
    const tasks = overview?.tasks ?? [];
    const deviations = overview?.deviations ?? [];
    const recentSignals = overview?.recentSignals ?? [];
    const queueCounts = queues?.counts ?? { newIngress: 0, needsLink: 0, needsClarification: 0, readyToConfirm: 0, openHandoffs: 0 };

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

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                <Card>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Новый вход</p>
                    <p className="mt-2 text-2xl font-medium">{queueCounts.newIngress}</p>
                </Card>
                <Card>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Нужна привязка</p>
                    <p className="mt-2 text-2xl font-medium">{queueCounts.needsLink}</p>
                </Card>
                <Card>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Нужно уточнение</p>
                    <p className="mt-2 text-2xl font-medium">{queueCounts.needsClarification}</p>
                </Card>
                <Card>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Готово к подтверждению</p>
                    <p className="mt-2 text-2xl font-medium">{queueCounts.readyToConfirm}</p>
                </Card>
                <Card>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Открытые handoff</p>
                    <p className="mt-2 text-2xl font-medium">{queueCounts.openHandoffs}</p>
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
                                                {task.field?.name ?? 'Поле не указано'} • сезон {task.season?.year ?? 'н/д'}
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
                            <h2 className="text-lg font-medium text-gray-900">Открытые handoff</h2>
                            <span className="text-sm text-gray-500">{handoffs.length}</span>
                        </div>
                        {handoffs.length === 0 ? (
                            <p className="text-sm text-gray-500">Нет активных handoff.</p>
                        ) : (
                            <div className="space-y-3">
                                {handoffs.slice(0, 6).map((handoff: any) => (
                                    <div key={handoff.id} className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-medium text-gray-900">{handoff.targetOwnerRole ?? 'manual'}</p>
                                            <span className="rounded-full bg-black px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white">
                                                {handoff.status}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-700">{handoff.summary}</p>
                                        {handoff.nextAction ? (
                                            <p className="mt-2 text-xs text-gray-500">{handoff.nextAction}</p>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

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
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-medium text-gray-900">Threads</h2>
                            <span className="text-sm text-gray-500">{threads.length}</span>
                        </div>
                        {threads.length === 0 ? (
                            <p className="text-sm text-gray-500">Нет активных диалогов.</p>
                        ) : (
                            <div className="space-y-3">
                                {threads.slice(0, 6).map((thread: any) => (
                                    <Link
                                        key={thread.id}
                                        href={`/front-office/threads/${encodeURIComponent(thread.threadKey)}`}
                                        className="block rounded-2xl border border-black/5 p-4 transition hover:border-black/10 hover:bg-gray-50"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-400">{thread.channel}</p>
                                            <span className="text-xs text-gray-500">{thread.currentHandoffStatus ?? thread.currentClassification ?? 'ОТКРЫТ'}</span>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-800">{thread.lastMessagePreview ?? 'Без текста'}</p>
                                        <p className="mt-2 text-xs text-gray-500">{thread.currentOwnerRole ?? 'Ответственный не назначен'}</p>
                                    </Link>
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
