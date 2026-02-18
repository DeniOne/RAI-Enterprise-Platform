import { cookies } from 'next/headers';

export async function getUserData() {
    const token = cookies().get('auth_token')?.value;
    if (!token) return null;

    try {
        const baseUrl = 'http://localhost:4000/api';
        const url = `${baseUrl}/users/me`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
            next: { revalidate: 0 },
            cache: 'no-store'
        });

        if (!response.ok) return null;

        return response.json();
    } catch (error) {
        console.error('[AuthServer] Fetch error:', error);
        return null;
    }
}
