import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
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

        const response = await fetch('http://localhost:4000/api/users/me', {
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
        const [tasksRes, fieldsRes, seasonsRes, techMapsRes, financeRes] = await Promise.all([
            fetch('http://localhost:4000/api/tasks', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            }),
            fetch('http://localhost:4000/api/fields', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            }),
            fetch('http://localhost:4000/api/seasons', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            }),
            fetch('http://localhost:4000/api/tech-map', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            }),
            fetch('http://localhost:4000/api/ofs/finance/dashboard', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            }),
        ])

        const tasks = tasksRes.ok ? await tasksRes.json() : []
        const fields = fieldsRes.ok ? await fieldsRes.json() : []
        const seasons = seasonsRes.ok ? await seasonsRes.json() : []
        const techMaps = techMapsRes.ok ? await techMapsRes.json() : []
        const finance = financeRes.ok ? await financeRes.json() : null

        return {
            tasksCount: Array.isArray(tasks) ? tasks.length : 0,
            fieldsCount: Array.isArray(fields) ? fields.length : 0,
            seasonsCount: Array.isArray(seasons) ? seasons.length : 0,
            activeTechMaps: Array.isArray(techMaps) ? techMaps.filter((m: any) => m.status === 'ACTIVE') : [],
            finance,
        }
    } catch (error) {
        console.error('Error fetching stats:', error)
        return { tasksCount: 0, fieldsCount: 0, seasonsCount: 0, activeTechMaps: [], finance: null }
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

                {/* Финансовые метрики (CFO View) */}
                {stats.finance && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="bg-black text-white border-none shadow-2xl">
                            <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">На счетах</h3>
                            <p className="text-3xl font-medium">
                                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(stats.finance.totalBalance)}
                            </p>
                        </Card>

                        <Card>
                            <h3 className="text-sm text-gray-600 mb-2">Лимит бюджета</h3>
                            <p className="text-2xl font-medium">
                                {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(stats.finance.budgetLimit)}
                            </p>
                        </Card>

                        <Card>
                            <h3 className="text-sm text-gray-600 mb-2">Burn Rate</h3>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-medium">{(stats.finance.budgetBurnRate * 100).toFixed(1)}%</p>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
                                    <div
                                        className="h-full bg-black transition-all duration-500"
                                        style={{ width: `${Math.min(stats.finance.budgetBurnRate * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <h3 className="text-sm text-gray-600 mb-2">Запас прочности</h3>
                            <p className="text-2xl font-medium text-green-600">
                                {(stats.finance.metrics.safetyMargin * 100).toFixed(0)}%
                            </p>
                        </Card>
                    </div>
                )}

                {/* Основная статистика */}
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
                        <p className="text-4xl font-medium">{stats.seasonsCount}</p>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Активные Техкарты */}
                    <Card className="rounded-2xl">
                        <h2 className="text-xl font-medium mb-4">Активные Техкарты</h2>
                        {stats.activeTechMaps.length > 0 ? (
                            <div className="space-y-4">
                                {stats.activeTechMaps.map((map: any) => (
                                    <Link
                                        key={map.id}
                                        href={`/dashboard/tech-maps/${map.id}`}
                                        className="block p-4 border border-black/5 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-sm">Техкарта #{map.id.slice(-4)}</p>
                                                <p className="text-xs text-gray-500">Версия: {map.version}</p>
                                            </div>
                                            <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                                                Active
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Нет активных техкарт</p>
                        )}
                    </Card>

                    {/* Действия */}
                    <Card className="rounded-2xl">
                        <h2 className="text-xl font-medium mb-4">Быстрые действия</h2>
                        <div className="space-y-3">
                            <Link
                                href="/dashboard/tasks/create"
                                className="block p-4 border border-black/5 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <p className="font-medium text-sm">Создать задачу</p>
                                <p className="text-xs text-gray-500">
                                    Добавить новую задачу в систему
                                </p>
                            </Link>
                        </div>
                    </Card>
                </div>

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
