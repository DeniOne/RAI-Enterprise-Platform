import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import Providers from '@/core/governance/Providers'
import { AiChatRoot } from '@/components/ai-chat/AiChatRoot'

export const metadata: Metadata = {
    title: 'RAI Enterprise Platform',
    description: 'РџР»Р°С‚С„РѕСЂРјР° СѓРїСЂР°РІР»РµРЅРёСЏ Р°РіСЂРѕР±РёР·РЅРµСЃРѕРј',
    icons: {
        icon: '/branding/rai-agroplatforma-transparent.png',
        shortcut: '/branding/rai-agroplatforma-transparent.png',
        apple: '/branding/rai-agroplatforma-transparent.png',
    },
}

/**
 * @layout RootLayout
 * @description РљРѕСЂРЅРµРІРѕР№ РјР°РєРµС‚ РїСЂРёР»РѕР¶РµРЅРёСЏ.
 * Р¤РРљРЎ: РЈРґР°Р»РµРЅР° РѕР±РµСЂС‚РєР° GovernanceShell, С‚Р°Рє РєР°Рє РѕРЅР° РІС‹Р·С‹РІР°Р»Р° РєРѕРЅС„Р»РёРєС‚ РјР°РєРµС‚РѕРІ.
 * РРЅСЃС‚РёС‚СѓС†РёРѕРЅР°Р»СЊРЅС‹Р№ СЃР»РѕР№ С‚РµРїРµСЂСЊ РІРЅРµРґСЂСЏРµС‚СЃСЏ С‚РѕС‡РµС‡РЅРѕ РІ AuthenticatedLayout.
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
