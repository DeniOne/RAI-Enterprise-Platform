'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Button, Card, Input } from '@/components/ui';
import { EXTERNAL_FRONT_OFFICE_BASE_PATH } from '@/lib/front-office-routes';

export function FrontOfficeLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError('Укажите логин и пароль.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/auth/front-office/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password,
                }),
            });

            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(payload?.error || 'Не удалось выполнить вход');
            }

            router.push(EXTERNAL_FRONT_OFFICE_BASE_PATH);
        } catch (requestError) {
            console.error('Не удалось выполнить вход:', requestError);
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : 'Не удалось выполнить вход',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-10">
            <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <Card>
                    <div className="space-y-5">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gray-400">
                                Front-office
                            </p>
                            <h1 className="mt-2 text-2xl font-medium text-gray-900">
                                Вход для контрагента
                            </h1>
                            <p className="mt-2 text-sm leading-relaxed text-gray-500">
                                Используйте логин и пароль только как резервный доступ. Основной способ входа
                                остаётся через `Telegram`.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="mt-0.5 h-4 w-4" />
                                        <div>{error}</div>
                                    </div>
                                </div>
                            ) : null}

                            <Input
                                label="Логин"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                placeholder="Введите логин"
                                className="h-11 rounded-xl"
                            />
                            <Input
                                label="Пароль"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Введите пароль"
                                className="h-11 rounded-xl"
                            />

                            <Button
                                type="submit"
                                loading={isSubmitting}
                                className="h-12 w-full rounded-2xl"
                            >
                                Войти
                            </Button>
                        </form>
                    </div>
                </Card>

                <Card>
                    <div className="space-y-4">
                        <h2 className="text-lg font-medium text-gray-900">Основной вход</h2>
                        <p className="text-sm leading-relaxed text-gray-500">
                            Если у вас уже есть активный `Telegram`, используйте основной сценарий входа через бота.
                        </p>
                        <Link
                            href="/telegram-login"
                            className="block rounded-2xl border border-black/10 px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                        >
                            Перейти ко входу через Telegram
                        </Link>
                        <p className="text-xs leading-relaxed text-gray-500">
                            Если вы ещё не завершили регистрацию по приглашению, сначала откройте ссылку из инвайта,
                            активируйте доступ и только потом используйте резервный вход.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
