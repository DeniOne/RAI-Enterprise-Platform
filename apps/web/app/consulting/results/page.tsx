import Link from 'next/link';
import { Card } from '@/components/ui';

export default function Page() {
    return (
        <div className='space-y-6'>
            <h1 className='text-xl font-medium text-gray-900'>Результат и эффект</h1>
            <Card>
                <p className='text-sm text-gray-700'>Хаб итогов: факт урожая, план/факт, performance-оплата.</p>
            </Card>
            <Card>
                <h3 className='text-sm font-semibold mb-3'>Разделы</h3>
                <ul className='space-y-2'>
                <li><Link href='/consulting/results/actual' className='text-blue-600 hover:underline'>Фактический урожай</Link></li>
                <li><Link href='/consulting/results/plan-fact' className='text-blue-600 hover:underline'>Сравнение с планом</Link></li>
                <li><Link href='/consulting/results/performance' className='text-blue-600 hover:underline'>Performance-оплата</Link></li>
                </ul>
            </Card>        </div>
    );
}
