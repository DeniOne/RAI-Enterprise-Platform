'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { AuthorityProvider, UserRole } from './AuthorityContext';
import { create } from 'zustand';

interface AuthSimulationStore {
    currentRole: UserRole;
    setRole: (role: UserRole) => void;
}

export const useAuthSimulationStore = create<AuthSimulationStore>((set) => ({
    currentRole: 'CEO',
    setRole: (role) => set({ currentRole: role }),
}));

import { ThemeProvider } from '@/shared/components/ThemeProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
    const { currentRole } = useAuthSimulationStore();

    useEffect(() => {
        apiClient.defaults.headers.common['x-simulated-role'] = currentRole;
    }, [currentRole]);

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
