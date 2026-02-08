'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface DetailOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}

export function DetailOverlay({ isOpen, onClose, title, subtitle, children }: DetailOverlayProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            document.body.style.overflow = 'hidden';
        } else {
            setTimeout(() => setMounted(false), 300);
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    if (!isOpen && !mounted) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={clsx(
                    "fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Side Panel */}
            <div
                className={clsx(
                    "fixed top-0 right-0 bottom-0 z-[70] w-full max-w-2xl bg-[#0A0A0A] border-l border-white/10 shadow-2xl transition-transform duration-300 ease-out pointer-events-auto",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-8 border-bottom border-white/5 flex justify-between items-start">
                        <div>
                            <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1">
                                Детальный просмотр
                            </div>
                            <h2 className="text-2xl font-light tracking-tight">{title}</h2>
                            {subtitle && <p className="text-sm opacity-60 mt-1">{subtitle}</p>}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/5 transition-colors opacity-40 hover:opacity-100"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
                        {children}
                    </div>

                    {/* Footer Footer */}
                    <div className="p-8 border-t border-white/5 text-[10px] uppercase tracking-widest opacity-20 flex justify-between">
                        <span>Projection of Truth</span>
                        <span>Beta v2.4</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
      `}</style>
        </>
    );
}
