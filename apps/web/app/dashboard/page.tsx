import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui'
import { RecommendationPanel, AdvisoryRecommendation } from '@/components/advisory/RecommendationPanel'
import { getUserData } from '@/lib/api/auth-server';
import { GovernanceTestButton } from '@/shared/components/GovernanceTestButton';
import { FinancialMetrics } from '@/components/dashboard/FinancialMetrics';

async function getStats(token: string) {
    try {
        const [tasksRes, fieldsRes, seasonsRes, techMapsRes, financeRes] = await Promise.all([
            fetch('http://localhost:4000/api/tasks/my', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            }),
            fetch('http://localhost:4000/api/registry/fields', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            }),
            fetch('http://localhost:4000/api/orchestrator/stages', {
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
            activeTechMaps: Array.isArray(techMaps) ? techMaps.filter((m: { status?: string }) => m.status === 'ACTIVE') : [],
            finance,
        }
    } catch (error) {
        console.error('Error fetching stats:', error)
        return { tasksCount: 0, fieldsCount: 0, seasonsCount: 0, activeTechMaps: [], finance: null }
    }
}

interface AdvisoryOpsMetrics {
    windowHours: number
    shadowEvaluated: number
    accepted: number
    rejected: number
    feedbackRecorded: number
    acceptRate: number
    rejectRate: number
    feedbackRate: number
    decisionLagAvgMinutes: number
}

interface AdvisoryRolloutStatus {
    stage: 'S0' | 'S1' | 'S2' | 'S3' | 'S4'
    percentage: number
    autoStopEnabled: boolean
}

interface ActiveTechMap {
    id: string;
    version: number;
    status?: string;
}

async function getAdvisoryRecommendations(token: string): Promise<AdvisoryRecommendation[]> {
    try {
        const response = await fetch('http://localhost:4000/api/advisory/recommendations/my?limit=10', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
        })

        if (!response.ok) {
            return []
        }

        const data = await response.json()
        return Array.isArray(data) ? data : []
    } catch (error) {
        console.error('Error fetching advisory recommendations:', error)
        return []
    }
}

async function getAdvisoryPilotStatus(token: string): Promise<{ enabled: boolean; scope: 'COMPANY' | 'USER' }> {
    try {
        const response = await fetch('http://localhost:4000/api/advisory/pilot/status', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
        })

        if (!response.ok) {
            return { enabled: false, scope: 'USER' }
        }

        const data = await response.json()
        return {
            enabled: Boolean(data?.enabled),
            scope: data?.scope === 'COMPANY' ? 'COMPANY' : 'USER',
        }
    } catch (error) {
        console.error('Error fetching advisory pilot status:', error)
        return { enabled: false, scope: 'USER' }
    }
}

async function getAdvisoryOpsMetrics(token: string): Promise<AdvisoryOpsMetrics | null> {
    try {
        const response = await fetch('http://localhost:4000/api/advisory/ops/metrics?windowHours=24', {
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
        console.error('Error fetching advisory ops metrics:', error)
        return null
    }
}

async function getAdvisoryRolloutStatus(token: string): Promise<AdvisoryRolloutStatus | null> {
    try {
        const response = await fetch('http://localhost:4000/api/advisory/rollout/status', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
        })

        if (!response.ok) {
            return null
        }

        const data = await response.json()
        return {
            stage: ['S0', 'S1', 'S2', 'S3', 'S4'].includes(data?.stage) ? data.stage : 'S0',
            percentage: Number.isFinite(Number(data?.percentage)) ? Number(data.percentage) : 0,
            autoStopEnabled: Boolean(data?.autoStopEnabled),
        }
    } catch (error) {
        console.error('Error fetching advisory rollout status:', error)
        return null
    }
}

export default async function DashboardPage() {
    const user = await getUserData()

    if (!user) {
        redirect('/login')
    }

    const token = cookies().get('auth_token')?.value || ''
    const stats = await getStats(token)
    const advisoryPilotStatus = await getAdvisoryPilotStatus(token)
    const advisoryOpsMetrics = await getAdvisoryOpsMetrics(token)
    const advisoryRolloutStatus = await getAdvisoryRolloutStatus(token)
    const advisoryRecommendations = advisoryPilotStatus.enabled
        ? await getAdvisoryRecommendations(token)
        : []

    return (
        <div className="space-y-12">
            {/* Приветствие */}
            <div>
                <h1 className="text-xl font-medium mb-1">
                    Привет, {user.name || user.email}!
                </h1>
                <p className="text-sm font-normal text-gray-500">
                    Добро пожаловать в RAI Enterprise Platform
                </p>
            </div>

            {/* Финансовые метрики (capability-gated via AuthorityContext in client layer) */}
            <FinancialMetrics finance={stats.finance} />

            {/* Основная статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium mb-3">Задачи</h3>
                    <p className="text-4xl font-medium">{stats.tasksCount}</p>
                </Card>

                <Card>
                    <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium mb-3">Поля</h3>
                    <p className="text-4xl font-medium">{stats.fieldsCount}</p>
                </Card>

                <Card>
                    <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium mb-3">Сезоны</h3>
                    <p className="text-4xl font-medium">{stats.seasonsCount}</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {advisoryPilotStatus.enabled ? (
                    <RecommendationPanel initialRecommendations={advisoryRecommendations} />
                ) : (
                    <Card className="rounded-2xl">
                        <h2 className="text-xl font-medium mb-3">Рекомендации Advisory</h2>
                        <p className="text-sm text-gray-600">
                            Advisory-пилот пока не включен для вашего аккаунта.
                        </p>
                    </Card>
                )}

                {/* Активные Техкарты */}
                <Card className="rounded-2xl">
                    <h2 className="text-xl font-medium mb-4">Активные Техкарты</h2>
                    {stats.activeTechMaps.length > 0 ? (
                        <div className="space-y-4">
                            {(stats.activeTechMaps as ActiveTechMap[]).map((map) => (
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

            {advisoryOpsMetrics && (
                <Card className="rounded-2xl">
                    <h2 className="text-xl font-medium mb-4">Advisory Ops (24h)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="border border-black/10 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Shadow Evaluated</p>
                            <p className="text-2xl font-medium">{advisoryOpsMetrics.shadowEvaluated}</p>
                        </div>
                        <div className="border border-black/10 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Accept Rate</p>
                            <p className="text-2xl font-medium">{(advisoryOpsMetrics.acceptRate * 100).toFixed(1)}%</p>
                        </div>
                        <div className="border border-black/10 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Reject Rate</p>
                            <p className="text-2xl font-medium">{(advisoryOpsMetrics.rejectRate * 100).toFixed(1)}%</p>
                        </div>
                        <div className="border border-black/10 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Decision Lag</p>
                            <p className="text-2xl font-medium">{advisoryOpsMetrics.decisionLagAvgMinutes.toFixed(1)}m</p>
                        </div>
                    </div>
                </Card>
            )}

            {advisoryRolloutStatus && (
                <Card className="rounded-2xl">
                    <h2 className="text-xl font-medium mb-4">Advisory Rollout</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border border-black/10 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Stage</p>
                            <p className="text-2xl font-medium">{advisoryRolloutStatus.stage}</p>
                        </div>
                        <div className="border border-black/10 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Exposure</p>
                            <p className="text-2xl font-medium">{advisoryRolloutStatus.percentage}%</p>
                        </div>
                        <div className="border border-black/10 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">Auto-stop</p>
                            <p className="text-2xl font-medium">{advisoryRolloutStatus.autoStopEnabled ? 'ON' : 'OFF'}</p>
                        </div>
                    </div>
                    {advisoryRolloutStatus.stage === 'S0' && (
                        <p className="text-sm text-amber-700 mt-3">
                            Rollout stage S0: advisory delivery is intentionally blocked until canary promotion.
                        </p>
                    )}
                </Card>
            )}

            {/* Logout */}
            <form action="/api/auth/logout" method="POST">
                <button
                    type="submit"
                    className="text-sm text-gray-600 hover:text-gray-900"
                >
                    Выйти
                </button>
            </form>

            {/* INSTITUTIONAL CONTROL TEST (PHASE 3) */}
            <div className="pt-12 border-t border-black/5">
                <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Institutional Sandbox</h2>
                <GovernanceTestButton />
            </div>
        </div>
    )
}
