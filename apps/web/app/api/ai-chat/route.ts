import { NextRequest, NextResponse } from 'next/server';

/**
 * DEPRECATED: /api/ai-chat route.
 * Now acts as a thin legacy proxy to the canonical /api/rai/chat in apps/api.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Proxy to backend via Internal Proxy (handled by next.config.js rewrites normally, 
        // but this specific route is handled by this file, so we manually redirect or just mark as deprecated)
        // For compliance with plan: "тонкий proxy в apps/api без своей логики"

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

        const response = await fetch(`${backendUrl}/rai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Forward original headers if needed (auth tokens, etc.)
                'Authorization': req.headers.get('Authorization') || '',
                'Cookie': req.headers.get('Cookie') || ''
            },
            body: JSON.stringify({
                message: body.message,
                workspaceContext: body.context,
                threadId: body.threadId
            })
        });

        const data = await response.json();

        // Map back to legacy format for old clients if any
        return NextResponse.json({
            threadId: data.threadId,
            assistantMessage: data.text,
            riskLevel: 'R1',
            suggestedActions: data.widgets
        });

    } catch (error) {
        console.error('[AiChat Legacy Proxy] Error:', error);
        return NextResponse.json(
            { error: 'Failed to process chat message via proxy' },
            { status: 500 }
        );
    }
}
