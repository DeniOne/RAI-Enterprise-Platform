'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Card } from '@/components/ui'
import { api } from '@/lib/api'

const taskSchema = z.object({
    title: z.string().min(3, 'Название должно содержать минимум 3 символа'),
    description: z.string().min(10, 'Описание должно содержать минимум 10 символов'),
    fieldId: z.string().min(1, 'Выберите поле'),
    type: z.string().min(1, 'Выберите тип задачи'),
    startDate: z.string().min(1, 'Укажите дату начала'),
    priority: z.enum(['low', 'medium', 'high'], {
        errorMap: () => ({ message: 'Выберите приоритет' }),
    }),
})

type TaskFormData = z.infer<typeof taskSchema>

export default function CreateTaskPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [fields, setFields] = useState<any[]>([])

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
    })

    useEffect(() => {
        // Загрузка списка полей
        api.fields
            .list()
            .then((res) => setFields(res.data || []))
            .catch((err) => console.error('Error loading fields:', err))
    }, [])

    const onSubmit = async (data: TaskFormData) => {
        setIsLoading(true)
        setError(null)

        try {
            await api.tasks.create(data)
            router.push('/dashboard')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка при создании задачи')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-xl font-medium mb-1">Создать задачу</h1>
                    <p className="text-sm font-normal text-gray-500">
                        Заполните форму для создания новой задачи
                    </p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Название задачи"
                            placeholder="Например: Посев рапса"
                            error={errors.title?.message}
                            {...register('title')}
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-normal text-gray-700 block">
                                Описание
                            </label>
                            <textarea
                                className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal focus:ring-2 focus:ring-black/20 focus:border-black/20 outline-none"
                                rows={4}
                                placeholder="Подробное описание задачи..."
                                {...register('description')}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">
                                    {errors.description.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-normal text-gray-700 block">
                                Поле
                            </label>
                            <select
                                className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal focus:ring-2 focus:ring-black/20 focus:border-black/20 outline-none"
                                {...register('fieldId')}
                            >
                                <option value="">Выберите поле</option>
                                {fields.map((field) => (
                                    <option key={field.id} value={field.id}>
                                        {field.name || field.id}
                                    </option>
                                ))}
                            </select>
                            {errors.fieldId && (
                                <p className="text-sm text-red-500">{errors.fieldId.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-normal text-gray-700 block">
                                Тип задачи
                            </label>
                            <select
                                className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal focus:ring-2 focus:ring-black/20 focus:border-black/20 outline-none"
                                {...register('type')}
                            >
                                <option value="">Выберите тип</option>
                                <option value="plowing">Вспашка</option>
                                <option value="seeding">Посев</option>
                                <option value="fertilizing">Удобрение</option>
                                <option value="harvesting">Уборка</option>
                            </select>
                            {errors.type && (
                                <p className="text-sm text-red-500">{errors.type.message}</p>
                            )}
                        </div>

                        <Input
                            label="Дата начала"
                            type="date"
                            error={errors.startDate?.message}
                            {...register('startDate')}
                        />

                        <div className="space-y-2">
                            <label className="text-sm font-normal text-gray-700 block">
                                Приоритет
                            </label>
                            <select
                                className="w-full border border-black/10 rounded-lg px-4 py-2 font-normal focus:ring-2 focus:ring-black/20 focus:border-black/20 outline-none"
                                {...register('priority')}
                            >
                                <option value="">Выберите приоритет</option>
                                <option value="low">Низкий</option>
                                <option value="medium">Средний</option>
                                <option value="high">Высокий</option>
                            </select>
                            {errors.priority && (
                                <p className="text-sm text-red-500">
                                    {errors.priority.message}
                                </p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isLoading}
                                className="flex-1"
                            >
                                {isLoading ? 'Создание...' : 'Создать задачу'}
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => router.push('/dashboard')}
                            >
                                Отмена
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    )
}
