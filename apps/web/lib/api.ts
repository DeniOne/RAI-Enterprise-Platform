import axios from 'axios'

// Axios используется ТОЛЬКО в Client Components
// для запросов, которые НЕ требуют SSR
export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true, // Отправляет cookies автоматически
})

// Обработка ошибок
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Редирект на логин при 401
            if (typeof window !== 'undefined') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

// Типизированные endpoints для client-side
export const api = {
    tasks: {
        list: () => apiClient.get('/tasks'),
        create: (data: unknown) => apiClient.post('/tasks', data),
    },
    fields: {
        list: () => apiClient.get('/fields'),
    },
    consulting: {
        plans: () => apiClient.get('/consulting/plans'),
        execution: {
            list: () => apiClient.get('/consulting/execution/operations'),
            start: (operationId: string) => apiClient.post(`/consulting/execution/${operationId}/start`),
            complete: (data: unknown) => apiClient.post('/consulting/execution/complete', data),
        },
        yield: {
            save: (data: unknown) => apiClient.post('/consulting/yield', data),
            getByPlan: (planId: string) => apiClient.get(`/consulting/yield/plan/${planId}`),
        },
        kpi: {
            plan: (planId: string) => apiClient.get(`/consulting/kpi/plan/${planId}`),
            company: (seasonId: string) => apiClient.get(`/consulting/kpi/company/${seasonId}`),
        }
    }
}
