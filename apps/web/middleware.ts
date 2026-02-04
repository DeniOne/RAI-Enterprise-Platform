import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')
    const path = request.nextUrl.pathname

    console.log(`[Middleware] Path: ${path}, Token: ${token ? 'exists' : 'none'}`)

    // Защита приватных роутов
    if (path.startsWith('/dashboard')) {
        if (!token) {
            console.log('[Middleware] No token, redirecting to /login')
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // НЕ редиректим с /login на /dashboard — пусть пользователь сам логинится
    // Убрал эту логику, потому что она создаёт loop

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/debug'],
}
