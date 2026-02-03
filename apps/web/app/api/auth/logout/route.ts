import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
    try {
        // Удаление HttpOnly cookie
        cookies().delete('auth_token')

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Logout error:', error)
        return NextResponse.json(
            { error: 'Ошибка при выходе' },
            { status: 500 }
        )
    }
}
