import React from 'react';
import { GeistSans } from 'geist/font/sans';
import clsx from 'clsx';
import Link from 'next/link';

export default function StrategicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const timestamp = new Date().toISOString();

    return (
        <div className={clsx(
            "min-h-screen bg-[#050505] text-[#FAFAFA] selection:bg-white/20 selection:text-white",
            "font-sans antialiased"
        )}>
            {/* 🛡️ ARCHITECTURAL GUARD: Pointer Events Lock */}
            {/* Только навигация и оверлеи имеют pointer-events: auto */}
            <div className="relative pointer-events-none">

                {/* Header / Brand */}
                <header className="fixed top-0 left-0 right-0 z-50 p-6 pointer-events-auto">
                    <div className="max-w-screen-2xl mx-auto flex justify-between items-end">
                        <div>
                            <Link href="/strategic" className="text-sm tracking-[0.2em] font-medium uppercase opacity-80 hover:opacity-100 transition-opacity">
                                RAI_EP // Strategic Projection
                            </Link>
                            <div className="text-[10px] uppercase tracking-widest opacity-40 mt-1">
                                Phase Beta / Normative: Front Canon
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            <div className="text-[10px] uppercase tracking-widest opacity-40">
                                Data as of: <span className="text-white/60">{timestamp}</span>
                            </div>
                            <div className="flex gap-4">
                                <form action="/api/auth/logout" method="POST" className="pointer-events-auto">
                                    <button type="submit" className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
                                        Logout
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Global Grainy Background / Noise */}
                <div className="fixed inset-0 pointer-events-none opacity-[0.03] grayscale bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-[-1]" />

                {/* Main Content Area */}
                <main className="relative pt-32 pb-20 px-6 max-w-screen-2xl mx-auto pointer-events-auto">
                    {children}
                </main>

                {/* Footer info */}
                <footer className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none">
                    <div className="max-w-screen-2xl mx-auto flex justify-between items-center text-[10px] uppercase tracking-widest opacity-20">
                        <div>System Integrity: Verified</div>
                        <div>Authurized Access Only</div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
