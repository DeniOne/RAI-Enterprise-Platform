'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
    const [cookies, setCookies] = useState<string>('')
    const [tokenValid, setTokenValid] = useState<boolean | null>(null)

    useEffect(() => {
        // Get all cookies
        setCookies(document.cookie)

        // Test token validity
        const testToken = async () => {
            try {
                const response = await fetch('http://localhost:4000/users/me', {
                    headers: {
                        Authorization: `Bearer ${getCookie('auth_token')}`,
                    },
                })
                setTokenValid(response.ok)
            } catch (e) {
                setTokenValid(false)
            }
        }
        testToken()
    }, [])

    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return ''
    }

    const clearCookies = () => {
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        window.location.reload()
    }

    return (
        <div className="p-8">
            <h1 className="mb-1 text-xl font-medium text-gray-900">Debug Page</h1>

            <div className="space-y-4">
                <div>
                    <h2 className="font-medium">Cookies:</h2>
                    <pre className="bg-gray-100 p-2 rounded">{cookies || 'No cookies'}</pre>
                </div>

                <div>
                    <h2 className="font-medium">Token Valid:</h2>
                    <p>{tokenValid === null ? 'Checking...' : tokenValid ? '✅ Valid' : '❌ Invalid'}</p>
                </div>

                <button
                    onClick={clearCookies}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Clear Cookies & Reload
                </button>
            </div>
        </div>
    )
}
