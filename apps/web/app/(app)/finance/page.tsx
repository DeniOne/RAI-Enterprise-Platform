import { Card } from '@/components/ui';

export default function FinancePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-xl font-medium text-gray-900 mb-6">Финансы</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium mb-3">Баланс</h3>
                    <p className="text-4xl font-medium">0 ₽</p>
                </Card>
                <Card>
                    <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium mb-3">Cash Flow</h3>
                    <p className="text-4xl font-medium">0 ₽</p>
                </Card>
                <Card>
                    <h3 className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-medium mb-3">Задолженность</h3>
                    <p className="text-4xl font-medium">0 ₽</p>
                </Card>
            </div>

            <Card className="min-h-[300px] flex items-center justify-center border-dashed">
                <p className="text-sm text-gray-400 uppercase tracking-widest font-medium">
                    Content Placeholder // Phase Beta
                </p>
            </Card>
        </div>
    );
}
