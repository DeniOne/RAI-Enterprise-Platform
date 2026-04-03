'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import {
    EXTERNAL_FRONT_OFFICE_BASE_PATH,
    EXTERNAL_FRONT_OFFICE_LOGIN_PATH,
} from '@/lib/front-office-routes';

interface InvitationPreview {
    id: string;
    status: string;
    expiresAt: string;
    company?: { id: string; name: string } | null;
    account?: { id: string; name: string } | null;
    party?: { id: string; name: string } | null;
    contact?: {
        fullName?: string | null;
        position?: string | null;
        phone?: string | null;
        email?: string | null;
    } | null;
    proposedLogin?: string | null;
    activationUrl?: string | null;
    botStartLink?: string | null;
}

export function FrontOfficeActivateClient({ token }: { token: string }) {
    const router = useRouter();
    const [preview, setPreview] = useState<InvitationPreview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [telegramId, setTelegramId] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isActivated, setIsActivated] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('В ссылке отсутствует токен приглашения.');
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        async function loadPreview() {
            setIsLoading(true);
            setError('');

            try {
                const response = await fetch(`/api/auth/front-office/invitations/${encodeURIComponent(token)}`, {
                    cache: 'no-store',
                });
                const payload = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(payload?.error || 'Не удалось загрузить приглашение');
                }

                if (!isMounted) {
                    return;
                }

                setPreview(payload);
                setName(payload?.contact?.fullName || '');
                setUsername(payload?.proposedLogin || '');
            } catch (requestError) {
                console.error('Не удалось загрузить приглашение:', requestError);
                if (isMounted) {
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : 'Не удалось загрузить приглашение',
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadPreview();

        return () => {
            isMounted = false;
        };
    }, [token]);

    const handleActivate = async () => {
        if (!token) {
            setError('Токен приглашения отсутствует.');
            return;
        }

        if (!telegramId.trim()) {
            setError('Укажите ID Telegram, на который пришло приглашение.');
            return;
        }

        if ((username.trim() || password.trim() || passwordConfirm.trim()) && !username.trim()) {
            setError('Если задаёте резервный вход, укажите логин.');
            return;
        }

        if ((username.trim() || password.trim() || passwordConfirm.trim()) && !password.trim()) {
            setError('Если задаёте резервный вход, укажите пароль.');
            return;
        }

        if (password.trim() && password.trim() !== passwordConfirm.trim()) {
            setError('Подтверждение пароля не совпадает.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/auth/front-office/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    telegramId: telegramId.trim(),
                    name: name.trim() || undefined,
                    username: username.trim() || undefined,
                    password: password.trim() || undefined,
                }),
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(payload?.error || 'Не удалось активировать приглашение');
            }

            setIsActivated(true);
        } catch (requestError) {
            console.error('Не удалось активировать приглашение:', requestError);
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Не удалось активировать приглашение',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto flex max-w-5xl flex-col gap-6 lg:flex-row">
                <Card className="flex-1">
                    <div className="space-y-4">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-400">
                                Внешний кабинет
                            </p>
                            <h1 className="mt-2 text-2xl font-medium text-gray-900">
                                Доступ контрагента в систему
                            </h1>
                            <p className="mt-2 text-sm leading-relaxed text-gray-500">
                                Эта страница завершает регистрацию приглашённого контакта и сразу открывает
                                рабочий контур хозяйства.
                            </p>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-gray-50 px-4 py-4 text-sm text-gray-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Загрузка приглашения...
                            </div>
                        ) : error && !preview ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 h-4 w-4" />
                                    <div>{error}</div>
                                </div>
                            </div>
                        ) : preview ? (
                            <div className="space-y-4">
                                <div className="rounded-2xl border border-black/10 bg-gray-50 px-4 py-4">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                        Приглашение
                                    </div>
                                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                                        <div>
                                            <span className="font-medium text-gray-900">Компания:</span>{' '}
                                            {preview.company?.name || '—'}
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">Контрагент:</span>{' '}
                                            {preview.party?.name || preview.account?.name || '—'}
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">Контакт:</span>{' '}
                                            {preview.contact?.fullName || '—'}
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">Должность:</span>{' '}
                                            {preview.contact?.position || '—'}
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">Срок действия:</span>{' '}
                                            {new Date(preview.expiresAt).toLocaleString('ru-RU')}
                                        </div>
                                    </div>
                                </div>

                                {!isActivated ? (
                                    <div className="space-y-4">
                                        {error ? (
                                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                                {error}
                                            </div>
                                        ) : null}

                                        <Input
                                            label="ID Telegram"
                                            value={telegramId}
                                            onChange={(event) => setTelegramId(event.target.value)}
                                            placeholder="Введите тот ID, на который пришло приглашение"
                                            className="h-11 rounded-xl"
                                        />
                                        <Input
                                            label="Ваше имя"
                                            value={name}
                                            onChange={(event) => setName(event.target.value)}
                                            placeholder="Как отображать вас в системе"
                                            className="h-11 rounded-xl"
                                        />
                                        <Input
                                            label="Резервный логин"
                                            value={username}
                                            onChange={(event) => setUsername(event.target.value)}
                                            placeholder="Необязательно"
                                            className="h-11 rounded-xl"
                                        />
                                        <Input
                                            label="Пароль для резервного входа"
                                            type="password"
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            placeholder="Необязательно"
                                            className="h-11 rounded-xl"
                                        />
                                        <Input
                                            label="Подтвердите пароль"
                                            type="password"
                                            value={passwordConfirm}
                                            onChange={(event) => setPasswordConfirm(event.target.value)}
                                            placeholder="Повторите пароль"
                                            className="h-11 rounded-xl"
                                        />
                                        <p className="text-xs leading-relaxed text-gray-500">
                                            Основной вход остаётся через `Telegram`. Логин и пароль нужны только как
                                            дополнительный резервный способ входа.
                                        </p>

                                        <Button
                                            type="button"
                                            loading={isSubmitting}
                                            onClick={handleActivate}
                                            className="h-12 w-full rounded-2xl"
                                        >
                                            Активировать доступ
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="mt-0.5 h-5 w-5" />
                                            <div className="space-y-1">
                                                <div className="text-sm font-semibold">Доступ активирован</div>
                                                <div className="text-xs leading-relaxed opacity-90">
                                                    Сессия уже создана. Можно сразу открыть внешний портал контрагента.
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            className="h-11 w-full rounded-2xl"
                                            onClick={() => router.push(EXTERNAL_FRONT_OFFICE_BASE_PATH)}
                                        >
                                            Открыть портал
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </Card>

                <Card className="w-full lg:max-w-sm">
                    <div className="space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Если нужно войти позже</h2>
                        <p className="text-sm leading-relaxed text-gray-500">
                            Основной вход для внешнего пользователя идёт через `Telegram`. Резервный вход по логину и
                            паролю доступен после активации приглашения.
                        </p>
                        <div className="space-y-3">
                            <Link
                                href="/telegram-login"
                                className="block rounded-2xl border border-black/10 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                            >
                                Войти через Telegram
                            </Link>
                            <Link
                                href={EXTERNAL_FRONT_OFFICE_LOGIN_PATH}
                                className="block rounded-2xl border border-black/10 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                            >
                                Войти по логину и паролю
                            </Link>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
