import type { Metadata } from "next";
import { Manrope, Outfit } from "next/font/google";
import { SmoothScroll } from "@/components/SmoothScroll";
import { getSiteProfile } from "@/lib/site-profile";
import "./globals.css";

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  variable: "--font-manrope",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const siteProfile = getSiteProfile();

export const metadata: Metadata = {
  metadataBase: siteProfile.siteUrl,
  title: "ГРИПИЛ — сохраните урожай рапса",
  description: "Лендинг ГРИПИЛ о защите рапса от осыпания перед уборкой с честной формой заявки и технологическим сценарием.",
  applicationName: "ГРИПИЛ",
  alternates: siteProfile.allowIndexing ? { canonical: "/" } : undefined,
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: siteProfile.siteUrl,
    siteName: "ГРИПИЛ",
    title: "ГРИПИЛ — сохраните урожай рапса",
    description: "Био-комплекс ГРИПИЛ помогает удержать урожай до уборки и даёт честный сценарий внедрения.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ГРИПИЛ — сохраните урожай рапса",
    description: "Технология защиты рапса от осыпания перед уборкой.",
  },
  robots: {
    index: siteProfile.allowIndexing,
    follow: siteProfile.allowIndexing,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} ${outfit.variable} bg-[#EFECE6] font-sans antialiased text-[#112118]`}>
        <div
          id="page-transition-curtain"
          className="pointer-events-none fixed inset-0 z-[99999] bg-[#06080b]"
          style={{ transform: "translateY(100%)" }}
        />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
