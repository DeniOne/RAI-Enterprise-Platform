import { NextResponse } from 'next/server';

export function resolveBackendUrl() {
    const candidate = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    if (candidate && /^https?:\/\//i.test(candidate)) {
        return candidate.replace(/\/$/, '');
    }

    return 'http://localhost:4000/api';
}

export function setAuthCookie(response: NextResponse, token: string) {
    response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
    });
}
