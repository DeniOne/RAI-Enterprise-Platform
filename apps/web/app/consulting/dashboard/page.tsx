'use client';

export default function ConsultingDashboard() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Дашборд Консалтинга</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white border border-black/5 rounded-2xl shadow-sm">
                    <h3 className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Активные планы</h3>
                    <p className="text-3xl font-bold">0</p>
                </div>
                <div className="p-6 bg-white border border-black/5 rounded-2xl shadow-sm">
                    <h3 className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Техкарты в работе</h3>
                    <p className="text-3xl font-bold">0</p>
                </div>
                <div className="p-6 bg-white border border-black/5 rounded-2xl shadow-sm">
                    <h3 className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Отклонения</h3>
                    <p className="text-3xl font-bold text-red-500">0</p>
                </div>
            </div>
        </div>
    );
}
