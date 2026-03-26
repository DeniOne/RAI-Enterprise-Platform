"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import Image from "next/image";

export default function SocialProofSection() {
  // Array to fake an infinite marquee of generic placeholders for B2B logos
  const placeholderLogos = [
    "AGRO HOLDING", "RUS TERRA", "ECO CROP", "BIO FARM", "STEPPE ALLIANCE", "AGRI-PRO",
    "AGRO HOLDING", "RUS TERRA", "ECO CROP", "BIO FARM", "STEPPE ALLIANCE", "AGRI-PRO"
  ];

  return (
    <section id="social-proof" className="py-20 lg:py-32 bg-[#112118] overflow-hidden relative border-t border-[#112118] font-sans">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-[#CDFF00]/5 blur-[120px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-16 mb-16 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center"
        >
          <div className="flex items-center gap-1 mb-6 text-[#CDFF00]">
            <Star className="w-4 h-4 fill-[#CDFF00]" />
            <Star className="w-4 h-4 fill-[#CDFF00]" />
            <Star className="w-4 h-4 fill-[#CDFF00]" />
            <Star className="w-4 h-4 fill-[#CDFF00]" />
            <Star className="w-4 h-4 fill-[#CDFF00]" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-[#EFECE6] mb-4">Нам уже доверяют</h2>
          <p className="text-[#EFECE6]/50 uppercase tracking-widest font-mono text-xs sm:text-sm">
            Защищено более <span className="text-[#CDFF00] font-bold">120 000 га</span> по всей стране
          </p>
        </motion.div>
      </div>

      {/* Infinite Marquee of Logos */}
      <div className="relative w-full flex overflow-x-hidden border-y border-[#EFECE6]/5 bg-[#0C1810] py-6 mb-20 z-10">
        <motion.div
          className="flex whitespace-nowrap gap-16 lg:gap-24 px-8 items-center"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ ease: "linear", duration: 25, repeat: Infinity }}
        >
          {placeholderLogos.map((text, i) => (
            <div key={i} className="flex items-center justify-center shrink-0 opacity-40 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
              {/* ЗАГЛУШКА ДЛЯ ЛОГОТИПОВ */}
              <div className="h-10 px-6 border border-[#EFECE6]/20 rounded-sm flex items-center justify-center text-[#EFECE6] font-display text-xl font-bold tracking-tighter mix-blend-screen">
                {text}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Quotes Cards */}
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-16 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 relative z-10">
        
        {/* Quote 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-[#EFECE6]/5 border border-[#EFECE6]/10 backdrop-blur-md p-8 md:p-10 rounded-[2px] relative group"
        >
          <Quote className="absolute top-8 right-8 w-12 h-12 text-[#CDFF00]/10 group-hover:text-[#CDFF00]/20 transition-colors" />
          <p className="text-[#EFECE6]/90 text-lg sm:text-xl font-light leading-relaxed mb-8">
            "Раньше при шквалах мы теряли до 20% озимого рапса на нижних полях. После обработки ГРИПИЛ створки держат так, что потери снизились до статистической погрешности. Работаем авиацией, раствор ложится идеально."
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#EFECE6]/10 overflow-hidden flex items-center justify-center relative border border-[#EFECE6]/20">
              <Image src="/images/agronomist-proof.jpg" alt="Агроном" fill className="object-cover grayscale focus:grayscale-0 hover:grayscale-0 transition-all duration-500" />
            </div>
            <div>
              <div className="font-display text-[#EFECE6] text-lg">Александр К.</div>
              <div className="text-[#EFECE6]/40 font-mono text-xs uppercase tracking-widest mt-1">Главный агроном, 12 000 га</div>
            </div>
          </div>
        </motion.div>

        {/* Quote 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-[#EFECE6]/5 border border-[#EFECE6]/10 backdrop-blur-md p-8 md:p-10 rounded-[2px] relative group"
        >
          <Quote className="absolute top-8 right-8 w-12 h-12 text-[#CDFF00]/10 group-hover:text-[#CDFF00]/20 transition-colors" />
          <p className="text-[#EFECE6]/90 text-lg sm:text-xl font-light leading-relaxed mb-8">
            "Никакого парникового эффекта внутри стручка: рапс дозревает естественно. В этом году убрали с влажностью 8%, сэкономили миллионы на сушке. Биоразлагаемость — огромный плюс для экологии хозяйства."
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#EFECE6]/10 overflow-hidden flex items-center justify-center relative border border-[#EFECE6]/20">
              <Image src="/images/agronomist-proof.jpg" alt="Агроном" fill className="object-cover grayscale focus:grayscale-0 hover:grayscale-0 transition-all duration-500" />
            </div>
            <div>
              <div className="font-display text-[#EFECE6] text-lg">Михаил В.</div>
              <div className="text-[#EFECE6]/40 font-mono text-xs uppercase tracking-widest mt-1">Директор по инновациям</div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
