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
        create: (data: any) => apiClient.post('/tasks', data),
    },
    fields: {
        list: () => apiClient.get('/fields'),
    },
}
