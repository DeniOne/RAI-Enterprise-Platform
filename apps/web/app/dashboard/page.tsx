import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui'

interface User {
    id: string
    name: string
    email: string
}

async function getUserData(): Promise<User | null> {
    try {
        const token = cookies().get('auth_token')?.value

        if (!token) {
            return null
        }

        const response = await fetch('http://localhost:4000/users/me', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
        })

        if (!response.ok) {
            return null
        }

        return response.json()
    } catch (error) {
        console.error('Error fetching user data:', error)
        return null
    }
}

async function getStats(token: string) {
    try {
        const [tasksRes, fieldsRes] = await Promise.all([
            fetch('http://localhost:4000/api/tasks', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            }),
            fetch('http://localhost:4000/api/fields', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            }),
        ])

        const tasks = tasksRes.ok ? await tasksRes.json() : []
        const fields = fieldsRes.ok ? await fieldsRes.json() : []

        return {
            tasksCount: Array.isArray(tasks) ? tasks.length : 0,
            fieldsCount: Array.isArray(fields) ? fields.length : 0,
        }
    } catch (error) {
        console.error('Error fetching stats:', error)
        return { tasksCount: 0, fieldsCount: 0 }
    }
}

export default async function DashboardPage() {
    const user = await getUserData()

    if (!user) {
        redirect('/login')
    }

    const token = cookies().get('auth_token')?.value || ''
    const stats = await getStats(token)

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Приветствие */}
                <div>
                    <h1 className="text-3xl font-medium mb-2">
                        Привет, {user.name || user.email}!
                    </h1>
                    <p className="text-gray-600">
                        Добро пожаловать в RAI Enterprise Platform
                    </p>
                </div>

                {/* Статистика */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <h3 className="text-sm text-gray-600 mb-2">Задачи</h3>
                        <p className="text-4xl font-medium">{stats.tasksCount}</p>
                    </Card>

                    <Card>
                        <h3 className="text-sm text-gray-600 mb-2">Поля</h3>
                        <p className="text-4xl font-medium">{stats.fieldsCount}</p>
                    </Card>

                    <Card>
                        <h3 className="text-sm text-gray-600 mb-2">Сезоны</h3>
                        <p className="text-4xl font-medium">0</p>
                    </Card>
                </div>

                {/* Действия */}
                <Card>
                    <h2 className="text-xl font-medium mb-4">Быстрые действия</h2>
                    <div className="space-y-3">
                        <a
                            href="/dashboard/tasks/create"
                            className="block p-4 border border-black/10 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <p className="font-medium">Создать задачу</p>
                            <p className="text-sm text-gray-600">
                                Добавить новую задачу в систему
                            </p>
                        </a>
                    </div>
                </Card>

                {/* Logout */}
                <form action="/api/auth/logout" method="POST">
                    <button
                        type="submit"
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Выйти
                    </button>
                </form>
            </div>
        </div>
    )
}
