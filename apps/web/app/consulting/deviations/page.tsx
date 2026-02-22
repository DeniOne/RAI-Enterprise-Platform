'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeviationsRoot() {
    const router = useRouter();

    useEffect(() => {
        router.push('/consulting/deviations/detected');
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center font-geist">
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
                <span>Перенаправление в реестр отклонений...</span>
            </div>
        </div>
    );
}
