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
                    "fixed top-0 right-0 bottom-0 z-[70] w-full max-w-2xl bg-white border-l border-black/5 shadow-2xl transition-transform duration-300 ease-out pointer-events-auto",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-10 border-b border-black/5 flex justify-between items-start">
                        <div>
                            <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-medium">
                                Детальный просмотр
                            </div>
                            <h2 className="text-3xl font-light tracking-tight text-gray-900">{title}</h2>
                            {subtitle && <p className="text-sm text-gray-500 mt-2 font-medium">{subtitle}</p>}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-300 hover:text-black"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-10 pt-6 custom-scrollbar text-gray-600">
                        {children}
                    </div>

                    {/* Footer */}
                    <div className="p-10 border-t border-black/5 text-[10px] uppercase tracking-widest text-gray-300 font-medium flex justify-between">
                        <span>Проекция Истины // RAI Enterprise</span>
                        <span>Версия Beta v2.4</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
        </>
    );
}
