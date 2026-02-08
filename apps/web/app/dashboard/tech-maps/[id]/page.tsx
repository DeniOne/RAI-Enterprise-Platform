import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui'
import Link from 'next/link'

interface MapResource {
    id: string
    type: string
    name: string
    amount: number
    unit: string
}

interface MapOperation {
    id: string
    name: string
    description?: string
    resources: MapResource[]
}

interface MapStage {
    id: string
    name: string
    sequence: number
    operations: MapOperation[]
}

interface TechMap {
    id: string
    seasonId: string
    status: string
    version: number
    stages: MapStage[]
}

async function getTechMap(id: string, token: string): Promise<TechMap | null> {
    try {
        const response = await fetch(`http://localhost:4000/api/tech-map/${id}`, {
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
        console.error('Error fetching tech map:', error)
        return null
    }
}

export default async function TechMapDetailPage({ params }: { params: { id: string } }) {
    const token = cookies().get('auth_token')?.value

    if (!token) {
        redirect('/login')
    }

    const techMap = await getTechMap(params.id, token)

    if (!techMap) {
        return (
            <div className="p-8">
                <Card className="p-12 text-center">
                    <h1 className="text-xl font-medium mb-4">Техкарта не найдена</h1>
                    <Link href="/dashboard" className="text-blue-600 hover:underline">
                        Вернуться на дашборд
                    </Link>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-8 bg-white">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-medium mb-2">Технологическая карта</h1>
                        <p className="text-gray-500">
                            Версия {techMap.version} • Статус: {techMap.status}
                        </p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="px-4 py-2 border border-black/10 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    >
                        Назад
                    </Link>
                </div>

                {/* Timeline View */}
                <div className="space-y-6">
                    {techMap.stages.map((stage) => (
                        <div key={stage.id} className="relative pl-8 border-l-2 border-gray-100 pb-12 last:pb-0">
                            {/* Dot */}
                            <div className="absolute left-[-9px] top-0 w-4 w-4 bg-black rounded-full ring-4 ring-white" />

                            <div className="space-y-4">
                                <h2 className="text-xl font-medium">{stage.name}</h2>

                                <div className="grid grid-cols-1 gap-4">
                                    {stage.operations.map((op) => (
                                        <Card key={op.id} className="p-6 rounded-2xl hover:shadow-sm transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-medium text-lg">{op.name}</h3>
                                                    {op.description && (
                                                        <p className="text-sm text-gray-500 mt-1">{op.description}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {op.resources.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-gray-50">
                                                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                                                        Ресурсы
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {op.resources.map((res) => (
                                                            <div
                                                                key={res.id}
                                                                className="px-3 py-1 bg-gray-50 border border-black/5 rounded-lg text-sm"
                                                            >
                                                                <span className="text-gray-600">{res.name}:</span>
                                                                <span className="ml-1 font-medium">{res.amount} {res.unit}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
