import { LoginForm } from '@/components/auth/LoginForm'

import { GovernanceTestButton } from '@/shared/components/GovernanceTestButton';

export default function Home() {
    return (
        <div className="space-y-8">
            <div className="max-w-2xl">
                <h1 className="text-4xl font-black tracking-tight mb-4">Institutional Core</h1>
                <p className="text-gray-500 leading-relaxed">
                    Добро пожаловать в центр управления RAI Enterprise. Текущая сессия защищена протоколами Level F.
                    Все критические действия требуют двухфазного подтверждения.
                </p>
            </div>

            <GovernanceTestButton />
        </div>
    );
}
