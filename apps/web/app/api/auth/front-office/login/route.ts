import { NextResponse } from 'next/server';
import { resolveBackendUrl, setAuthCookie } from '../_utils';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const backendUrl = resolveBackendUrl();

        const response = await fetch(`${backendUrl}/auth/front-office/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            cache: 'no-store',
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.accessToken) {
            return NextResponse.json(
                {
                    error:
                        payload?.message ||
                        payload?.error ||
                        'Не удалось выполнить вход',
                },
                { status: response.status || 401 },
            );
        }

        const result = NextResponse.json({
            success: true,
            user: payload.user,
            binding: payload.binding,
        });

        setAuthCookie(result, payload.accessToken);
        return result;
    } catch (error) {
        console.error('[FrontOfficeLogin] Ошибка:', error);
        return NextResponse.json(
            { error: 'Внутренняя ошибка входа' },
            { status: 500 },
        );
    }
}
