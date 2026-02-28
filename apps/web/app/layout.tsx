import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import Providers from '@/core/governance/Providers'
import { AiChatRoot } from '@/components/ai-chat/AiChatRoot'

export const metadata: Metadata = {
    title: 'RAI Enterprise Platform',
    description: 'Платформа управления агробизнесом',
    icons: {
        icon: '/branding/rai-agroplatforma-transparent.png',
        shortcut: '/branding/rai-agroplatforma-transparent.png',
        apple: '/branding/rai-agroplatforma-transparent.png',
    },
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

                    {/* Глобальная точка входа AI-Ассистента (Institutional Grade) */}
                    <AiChatRoot />
                </Providers>
            </body>
        </html>
    )
}
