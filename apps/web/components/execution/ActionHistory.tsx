import React from 'react';

export interface ActionHistoryItem {
    id: string;
    title: string;
    timestamp?: string;
    status?: string;
}

export function ActionHistory({ items = [] }: { items?: ActionHistoryItem[] }) {
    if (items.length === 0) {
        return (
            <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-gray-500">
                No action history yet.
            </div>
        );
    }

    return (
        <div className="space-y-2 rounded-2xl border border-black/10 bg-white p-4">
            {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-black/5 px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.timestamp ?? item.status ?? '-'}</p>
                </div>
            ))}
        </div>
    );
}
