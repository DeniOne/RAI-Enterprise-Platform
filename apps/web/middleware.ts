import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DEFAULT_LOGIN_PATH = '/login';
const EXTERNAL_LOGIN_PATH = '/portal/front-office/login';
const EXTERNAL_FRONT_OFFICE_BASE_PATH = '/portal/front-office';

const PUBLIC_PATH_PREFIXES = [
    '/login',
    '/front-office/login',
    '/front-office/activate',
    '/portal/front-office/login',
    '/portal/front-office/activate',
];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) {
        return null;
    }

    try {
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, '=');
        const binary = atob(padded);
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        const text = new TextDecoder().decode(bytes);
        return JSON.parse(text) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function redirectTo(path: string, request: NextRequest): NextResponse {
    return NextResponse.redirect(new URL(path, request.url));
}

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    const token = request.cookies.get('auth_token')?.value;
    const isPublic = isPublicPath(pathname);

    if (!token) {
        if (isPublic) {
            return NextResponse.next();
        }
        if (pathname.startsWith(EXTERNAL_FRONT_OFFICE_BASE_PATH)) {
            return redirectTo(EXTERNAL_LOGIN_PATH, request);
        }
        return redirectTo(DEFAULT_LOGIN_PATH, request);
    }

    const payload = decodeJwtPayload(token);
    const role =
        typeof payload?.role === 'string'
            ? payload.role.trim().toUpperCase()
            : null;
    const isExternalFrontOffice = role === 'FRONT_OFFICE_USER';

    if (isExternalFrontOffice && !pathname.startsWith(EXTERNAL_FRONT_OFFICE_BASE_PATH)) {
        return redirectTo(EXTERNAL_FRONT_OFFICE_BASE_PATH, request);
    }

    if (isPublic) {
        if (isExternalFrontOffice) {
            return redirectTo(EXTERNAL_FRONT_OFFICE_BASE_PATH, request);
        }
        return redirectTo('/front-office', request);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
