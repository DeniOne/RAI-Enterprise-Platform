import { Monitor, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { GovernanceTestButton } from '@/shared/components/GovernanceTestButton';

export default function Home() {
    return (
        <div className="space-y-8">
            <div className="max-w-2xl">
                <h1 className="mb-1 text-xl font-medium tracking-tight text-gray-900">Институциональное ядро</h1>
                <p className="text-sm font-normal text-gray-500 leading-relaxed">
                    Добро пожаловать в центр управления РАИ. Текущая сессия защищена протоколами уровня F.
                    Все критические действия требуют двухфазного подтверждения.
                </p>
            </div>

            {/* Быстрый доступ (Phase 4) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mt-6">
                <Link href="/control-tower" className="group flex items-center gap-5 p-5 bg-white border border-black/10 rounded-2xl hover:bg-slate-50 hover:border-black/20 transition-all">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-black/5 shrink-0 group-hover:bg-white transition-colors">
                        <Monitor size={20} className="text-[#030213]" />
                    </div>
                    <div>
                        <p className="text-[14px] font-medium text-[#030213] tracking-tight">Главный пульт</p>
                        <p className="text-[13px] text-[#717182] mt-0.5">Трассировка, контроль доступности и аудит роя агентов</p>
                    </div>
                </Link>

                <Link href="/governance/security" className="group flex items-center gap-5 p-5 bg-white border border-black/10 rounded-2xl hover:bg-slate-50 hover:border-black/20 transition-all">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-black/5 shrink-0 group-hover:bg-white transition-colors">
                        <ShieldAlert size={20} className="text-[#030213]" />
                    </div>
                    <div>
                        <p className="text-[14px] font-medium text-[#030213] tracking-tight">Безопасность</p>
                        <p className="text-[13px] text-[#717182] mt-0.5">Инциденты, изоляция и сигнальный контур</p>
                    </div>
                </Link>
            </div>

            <GovernanceTestButton />
        </div>
    );
}
