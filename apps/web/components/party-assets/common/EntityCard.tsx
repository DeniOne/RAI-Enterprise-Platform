import { Card } from '@/components/ui';
import type { ReactNode } from 'react';

export function EntityCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-4">
      <h2 className="text-xl font-medium text-gray-900">{title}</h2>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}
