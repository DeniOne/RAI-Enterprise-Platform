import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import Providers from '@/core/governance/Providers'

export const metadata: Metadata = {
    title: 'RAI Enterprise Platform',
    description: 'Платформа управления агробизнесом',
}

/**
 * @layout RootLayout
 * @description Корневой макет приложения.
 * ФИКС: Удалена обертка GovernanceShell, так как она вызывала конфликт макетов.
 * Институциональный слой теперь внедряется точечно в AuthenticatedLayout.
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ru" className={GeistSans.className} suppressHydrationWarning>
            <body>
                <Providers>
                    {/* Контент теперь рендерится напрямую или через макеты страниц */}
                    {children}
                </Providers>
            </body>
        </html>
    )
}
