import { NextRequest, NextResponse } from 'next/server';
import { resolveBackendUrl } from '../../_utils';

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ token: string }> },
) {
    try {
        const { token } = await context.params;
        const backendUrl = resolveBackendUrl();
        const response = await fetch(
            `${backendUrl}/auth/front-office/invitations/${encodeURIComponent(token)}`,
            {
                cache: 'no-store',
            },
        );

        const payload = await response.json().catch(() => null);
        if (!response.ok) {
            return NextResponse.json(
                {
                    error:
                        payload?.message ||
                        payload?.error ||
                        'Не удалось загрузить приглашение',
                },
                { status: response.status || 500 },
            );
        }

        return NextResponse.json(payload, { status: 200 });
    } catch (error) {
        console.error('[FrontOfficeInvitationPreview] Ошибка:', error);
        return NextResponse.json(
            { error: 'Внутренняя ошибка загрузки приглашения' },
            { status: 500 },
        );
    }
}
