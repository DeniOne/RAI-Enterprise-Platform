import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

export const metadata: Metadata = {
    title: 'RAI Enterprise Platform',
    description: 'Платформа управления агробизнесом',
}

import Providers from '@/core/governance/Providers'
import { GovernanceShell } from '@/shared/components/GovernanceShell'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ru" className={GeistSans.className} suppressHydrationWarning>
            <body>
                <Providers>
                    <GovernanceShell>
                        {children}
                    </GovernanceShell>
                </Providers>
            </body>
        </html>
    )
}
