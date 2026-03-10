import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import Providers from "@/core/governance/Providers";
import { AiChatRoot } from "@/components/ai-chat/AiChatRoot";

export const metadata: Metadata = {
  title: "Платформа РАИ",
  description: "Платформа управления агробизнесом",
  icons: {
    icon: "/branding/rai-agroplatforma-transparent.png",
    shortcut: "/branding/rai-agroplatforma-transparent.png",
    apple: "/branding/rai-agroplatforma-transparent.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/**
 * @layout RootLayout
 * @description Корневой макет приложения.
 * Shell не внедряется на корневом уровне: он подключается точечно
 * через route layouts (`consulting`, `(app)`, `AuthenticatedLayout`).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={GeistSans.className} suppressHydrationWarning>
      <body>
        <Providers>
          {children}

          <AiChatRoot />
        </Providers>
      </body>
    </html>
  );
}
