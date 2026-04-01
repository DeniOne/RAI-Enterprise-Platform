'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { create } from 'zustand';

import { AuthorityProvider, UserRole } from './AuthorityContext';
import { ThemeProvider } from '@/shared/components/ThemeProvider';

interface AuthPrincipalStore {
    currentRole: UserRole;
    principalReady: boolean;
    setRoleFromPrincipal: (role: UserRole) => void;
    // Legacy alias: оставлен для обратной совместимости существующих импортов.
    setRole: (role: UserRole) => void;
}

const KNOWN_ROLES: UserRole[] = [
    'ADMIN',
    'CEO',
    'MANAGER',
    'AGRONOMIST',
    'FIELD_WORKER',
    'CLIENT_ADMIN',
    'USER',
    'FRONT_OFFICE_USER',
    'SYSTEM_ADMIN',
    'FOUNDER',
    'DIRECTOR_HR',
    'DIRECTOR_OFS',
    'DIRECTOR_ECONOMY',
    'DIRECTOR_FINANCE',
    'DIRECTOR_GR',
    'DIRECTOR_PRODUCTION',
];

function normalizeRole(value: unknown): UserRole {
    if (typeof value !== 'string') {
        return 'USER';
    }
    const normalized = value.trim().toUpperCase();
    if ((KNOWN_ROLES as string[]).includes(normalized)) {
        return normalized as UserRole;
    }
    return 'USER';
}

export const useAuthSimulationStore = create<AuthPrincipalStore>((set) => ({
    currentRole: 'USER',
    principalReady: false,
    setRoleFromPrincipal: (role) => set({ currentRole: role, principalReady: true }),
    setRole: (role) => set({ currentRole: role, principalReady: true }),
}));

// Новый алиас для явного чтения роли из authenticated principal.
export const useAuthPrincipalStore = useAuthSimulationStore;

export default function Providers({ children }: { children: React.ReactNode }) {
    const { currentRole, setRoleFromPrincipal } = useAuthSimulationStore();

    useEffect(() => {
        let disposed = false;

        const syncRoleFromPrincipal = async () => {
            try {
                const response = await fetch('/api/users/me', {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                });
                if (!response.ok) {
                    if (!disposed) {
                        setRoleFromPrincipal('USER');
                    }
                    return;
                }
                const profile = await response.json();
                if (!disposed) {
                    setRoleFromPrincipal(normalizeRole(profile?.role));
                }
            } catch {
                if (!disposed) {
                    setRoleFromPrincipal('USER');
                }
            }
        };

        void syncRoleFromPrincipal();

        return () => {
            disposed = true;
        };
    }, [setRoleFromPrincipal]);

    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
                refetchOnWindowFocus: false,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                <AuthorityProvider role={currentRole}>
                    {children}
                </AuthorityProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
