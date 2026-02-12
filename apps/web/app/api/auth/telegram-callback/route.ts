import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    try {
        const { token } = await request.json()

        if (!token) {
            return NextResponse.json(
                { error: 'Токен не предоставлен' },
                { status: 400 }
            )
        }

        // Установка HttpOnly cookie идентично обычному логину
        // Это гарантирует, что Middleware и Серверные компоненты увидят куку
        cookies().set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 дней (соответствует API)
            path: '/',
        })

        console.log('[AuthCallback] Server-side cookie set successfully')

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[AuthCallback] Error setting cookie:', error)
        return NextResponse.json(
            { error: 'Внутренняя ошибка при установке сессии' },
            { status: 500 }
        )
    }
}
