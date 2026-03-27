import type { Metadata } from "next";
import { Manrope, Outfit } from "next/font/google";
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
        {children}
      </body>
    </html>
  );
}
