import { NextRequest, NextResponse } from 'next/server';

/**
 * LEGACY COMPATIBILITY ROUTE:
 * /api/ai-chat -> /api/rai/chat
 */
export async function POST(req: NextRequest) {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        const body = await req.text();

        const response = await fetch(`${backendUrl}/rai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': req.headers.get('Content-Type') || 'application/json',
                Authorization: req.headers.get('Authorization') || '',
                Cookie: req.headers.get('Cookie') || '',
                'Idempotency-Key': req.headers.get('Idempotency-Key') || '',
            },
            body,
        });

        const payload = await response.text();

        return new NextResponse(payload, {
            status: response.status,
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/json',
                'X-Rai-Legacy-Proxy': '/api/ai-chat -> /api/rai/chat',
            },
        });
    } catch {
        return NextResponse.json(
            { error: 'Legacy proxy /api/ai-chat failed' },
            { status: 500 },
        );
    }
}
