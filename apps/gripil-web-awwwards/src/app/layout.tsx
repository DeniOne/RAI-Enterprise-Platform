import type { Metadata } from "next";
import { Manrope, Outfit } from "next/font/google";
import { Preloader } from "@/components/Preloader";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  variable: "--font-manrope",
});

const outfit = Outfit({
  subsets: ["latin"], // Outfit has limited cyrillic, but we can use it for numbers or fallbacks, or just use Manrope for everything. Let's use Manrope for both but configure weights.
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "ГРИПИЛ — Сохраните урожай рапса",
  description: "Био-комплекс для защиты рапса от осыпания перед уборкой.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${manrope.variable} ${outfit.variable} font-sans antialiased bg-[#EFECE6] text-[#112118]`} suppressHydrationWarning>
        <Preloader />
        <div id="page-transition-curtain" className="fixed inset-0 z-[99999] bg-[#06080b] pointer-events-none" style={{ transform: "translateY(100%)" }} />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
