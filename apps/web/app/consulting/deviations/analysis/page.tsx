'use client';

import React from 'react';

export default function AnalysisPlaceholder() {
    return (
        <div className="p-8 max-w-7xl mx-auto font-geist">
            <h1 className="text-2xl font-medium text-gray-900 tracking-tight mb-2">
                Анализ отклонений
            </h1>
            <p className="text-sm text-gray-500 mb-8">
                Модуль глубокого анализа причин инцидентов (Root Cause Analysis)
            </p>

            <div className="bg-white border border-black/5 rounded-3xl p-20 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 border border-black/5">
                    <span className="text-2xl">⏳</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Модуль в разработке</h3>
                <p className="text-sm text-gray-400 max-w-xs">
                    Инструментарий для разбора агрономических и экономических отклонений будет доступен в следующих релизах.
                </p>
            </div>
        </div>
    );
}
