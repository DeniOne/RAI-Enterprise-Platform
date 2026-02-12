import { cookies } from 'next/headers';

export async function getUserData() {
    const token = cookies().get('auth_token')?.value;
    if (!token) return null;

    try {
        const baseUrl = 'http://127.0.0.1:4000/api';
        const url = `${baseUrl}/users/me`;

        console.log(`[AuthServer] Validating token at: ${url}`);

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
            next: { revalidate: 0 },
            cache: 'no-store'
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[AuthServer] Auth check failed: ${response.status} at ${url}. Body: ${errorText}`);
            return null;
        }

        return response.json();
    } catch (error) {
        console.error('[AuthServer] Fetch error:', error);
        return null;
    }
}
