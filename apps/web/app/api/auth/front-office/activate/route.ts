import { NextResponse } from 'next/server';
import { resolveBackendUrl, setAuthCookie } from '../_utils';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const backendUrl = resolveBackendUrl();

        const response = await fetch(`${backendUrl}/auth/front-office/activate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(request.headers.get('x-forwarded-for')
                    ? { 'X-Forwarded-For': request.headers.get('x-forwarded-for') as string }
                    : {}),
                ...(request.headers.get('user-agent')
                    ? { 'User-Agent': request.headers.get('user-agent') as string }
                    : {}),
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
                        'Не удалось активировать приглашение',
                },
                { status: response.status || 400 },
            );
        }

        const result = NextResponse.json({
            success: true,
            user: payload.user,
            binding: payload.binding,
            account: payload.account,
            party: payload.party,
        });

        setAuthCookie(result, payload.accessToken);
        return result;
    } catch (error) {
        console.error('[FrontOfficeActivate] Ошибка:', error);
        return NextResponse.json(
            { error: 'Внутренняя ошибка активации приглашения' },
            { status: 500 },
        );
    }
}
