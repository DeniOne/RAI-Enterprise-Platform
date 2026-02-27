'use client';

import type { ReactNode } from 'react';

export function SidePanelForm({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Закрыть
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
