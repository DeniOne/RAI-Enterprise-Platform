import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Card } from '@/components/ui';
import { frontOfficeServerApi } from '@/lib/api/front-office-server';
import { getUserData, isExternalFrontOfficeUser } from '@/lib/api/auth-server';
import { getExternalFrontOfficeThreadPath } from '@/lib/front-office-routes';
import {
    formatFrontOfficeChannelLabel,
    formatFrontOfficeClarificationLabel,
    formatFrontOfficeDirectionLabel,
    formatFrontOfficeIntentLabel,
    formatFrontOfficeOwnerLabel,
    formatFrontOfficeText,
    formatStatusLabel,
} from '@/lib/ui-language';

export default async function FrontOfficeThreadPage({
    params,
}: {
    params: Promise<{ threadKey: string }>;
}) {
    const { threadKey } = await params;
    const decodedThreadKey = decodeURIComponent(threadKey);
    const user = await getUserData();
    const isExternalFrontOffice = isExternalFrontOfficeUser(user);

    if (isExternalFrontOffice) {
        redirect(getExternalFrontOfficeThreadPath(decodedThreadKey));
    }

    const data = await frontOfficeServerApi.thread(decodedThreadKey).catch(() => null);

    if (!data?.thread) {
        notFound();
    }

    const thread = data.thread;
    const messages = data.messages ?? [];
    const drafts = data.drafts ?? [];
    const handoffs = data.handoffs ?? [];

    const formatClarificationList = (items: unknown) => {
        if (!Array.isArray(items) || items.length === 0) {
            return 'Требуется уточнение';
        }

        return items
            .map((item) => formatFrontOfficeClarificationLabel(String(item)))
            .join(', ');
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Диалог</p>
                    <h1 className="mt-2 text-2xl font-medium text-gray-900">{thread.threadKey}</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        {formatFrontOfficeChannelLabel(thread.channel)} • ответственный {formatFrontOfficeOwnerLabel(thread.currentOwnerRole)} • {formatStatusLabel(thread.currentHandoffStatus ?? thread.currentClassification ?? 'OPEN')}
                    </p>
                </div>
                <Link href="/front-office" className="text-sm text-gray-500 hover:text-gray-900">Назад к списку</Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Card>
                    <h2 className="mb-4 text-lg font-medium text-gray-900">Сообщения</h2>
                    {messages.length === 0 ? (
                        <p className="text-sm text-gray-500">Сообщений пока нет.</p>
                    ) : (
                        <div className="space-y-3">
                            {messages.map((message: any) => (
                                <div key={message.id} className="rounded-2xl border border-black/5 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs uppercase tracking-[0.16em] text-gray-400">{formatFrontOfficeDirectionLabel(message.direction)}</p>
                                        <p className="text-xs text-gray-500">{formatFrontOfficeChannelLabel(message.channel)}</p>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-800">{formatFrontOfficeText(message.messageText)}</p>
                                </div>
                            ))}
                        </div>
                        )}
                </Card>

                <div className="space-y-6">
                    <Card>
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Черновики</h2>
                        {drafts.length === 0 ? (
                            <p className="text-sm text-gray-500">Черновики не найдены.</p>
                        ) : (
                            <div className="space-y-3">
                                {drafts.map((draft: any) => (
                                    <div key={draft.id} className="rounded-2xl border border-black/5 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatFrontOfficeIntentLabel(draft.payload?.suggestedIntent ?? draft.eventType)}
                                            </p>
                                            <p className="text-xs text-gray-500">{formatStatusLabel(draft.status)}</p>
                                        </div>
                                        <p className="mt-2 text-sm text-gray-700">{formatFrontOfficeText(draft.payload?.messageText)}</p>
                                        <p className="mt-2 text-xs text-gray-500">
                                            Привязка: поле {draft.anchor?.fieldId ? 'выбрано' : 'не выбрано'} • сезон {draft.anchor?.seasonId ? 'выбран' : 'не выбран'} • задача {draft.anchor?.taskId ? 'выбрана' : 'не выбрана'}
                                        </p>
                                        {Array.isArray(draft.mustClarifications) && draft.mustClarifications.length > 0 ? (
                                            <p className="mt-2 text-xs text-amber-700">
                                                Обязательно уточнить: {formatClarificationList(draft.mustClarifications)}
                                            </p>
                                        ) : null}
                                        {draft.payload?.commitResult ? (
                                            <p className="mt-2 text-xs text-emerald-700">
                                                Результат фиксации: {formatFrontOfficeIntentLabel(draft.payload.commitResult.kind ?? 'context_update')}
                                            </p>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <Card>
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Передачи</h2>
                        {handoffs.length === 0 ? (
                            <p className="text-sm text-gray-500">Передач по диалогу нет.</p>
                        ) : (
                            <div className="space-y-3">
                                {handoffs.map((handoff: any) => (
                                    <div key={handoff.id} className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                                        <p className="text-sm font-medium text-gray-900">{formatFrontOfficeOwnerLabel(handoff.targetOwnerRole)}</p>
                                        <p className="mt-1 text-xs text-gray-500">{formatStatusLabel(handoff.status)}</p>
                                        <p className="mt-2 text-sm text-gray-700">{formatFrontOfficeText(handoff.summary)}</p>
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
