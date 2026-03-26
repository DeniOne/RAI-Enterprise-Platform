"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Генерация случайных частиц пыльцы
function Particles() {
  const [elements, setElements] = useState<{ id: number; r: number; x: number; d: number; yStart: number }[]>([]);

  useEffect(() => {
    setElements(
      [...Array(30)].map((_, i) => ({
        id: i,
        r: Math.random() * 4 + 1, // Размер от 1 до 5px
        x: Math.random() * 100, // Позиция X
        yStart: Math.random() * 100 + 10, // Начальная Y позиция
        d: Math.random() * 15 + 10, // Длительность полета
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
      {elements.map((el) => (
        <motion.div
          key={el.id}
          className="absolute rounded-full bg-[#CDFF00] opacity-40 blur-[1px]"
          style={{
            width: el.r,
            height: el.r,
            left: `${el.x}%`,
            top: `${el.yStart}%`,
          }}
          animate={{ y: ["0vh", "-100vh"], x: ["-20px", "20px", "-20px"] }}
          transition={{
            y: {
              duration: el.d,
              repeat: Infinity,
              ease: "linear",
            },
            x: {
              duration: el.d / 2,
              repeat: Infinity,
              ease: "easeInOut",
              repeatType: "mirror",
            },
          }}
        />
      ))}
    </div>
  );
}

export default function EcologySection() {
  return (
    <section className="relative flex flex-col lg:flex-row min-h-screen bg-[#112118] overflow-hidden border-t border-[#CDFF00]/10">
      
      {/* Левая колонка - Типографика и Контент (50%) */}
      <div className="w-full lg:w-[45%] xl:w-[40%] flex items-center justify-center p-8 lg:p-20 relative z-20">
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as any }}
          className="max-w-xl w-full"
        >
          <div className="mb-6 flex items-center gap-4">
             <div className="w-12 h-[1px] bg-[#CDFF00]/60" />
             <span className="text-[#CDFF00] font-bold tracking-[0.2em] uppercase text-[10px] md:text-xs font-mono">
               100% Биоразлагаемость
             </span>
          </div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-medium tracking-tight leading-[1.05] mb-8 text-[#EFECE6] [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">
            Безопасно для <br />
            <span className="text-[#CDFF00] italic font-light">пчел и экологии</span>
          </h2>
          
          <p className="text-lg md:text-xl text-[#EFECE6]/70 font-light leading-relaxed mb-12">
            В отличие от синтетических клеев и жестких химических десикантов, ГРИПИЛ создан на основе натуральных хвойных экстрактов. 
          </p>

          <ul className="space-y-6">
             {[
               "Пленка полностью разрушается УФ-лучами за 4 недели",
               "Не оставляет микропластика в почве",
               "Абсолютно нетоксичен для насекомых-опылителей"
             ].map((text, idx) => (
               <li key={idx} className="flex items-start gap-5 group">
                 <div className="w-6 h-6 mt-1 rounded-sm bg-[#CDFF00]/10 border border-[#CDFF00]/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(205,255,0,0.15)] group-hover:bg-[#CDFF00]/20 transition-colors">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#CDFF00]" />
                 </div>
                 <span className="text-[#EFECE6]/90 font-light leading-relaxed text-base">{text}</span>
               </li>
             ))}
          </ul>
        </motion.div>
      </div>

      {/* Правая колонка - Живое Видео / Фото (50%) */}
      <div className="w-full lg:w-[55%] xl:w-[60%] relative min-h-[50vh] lg:min-h-screen z-10 overflow-hidden bg-black">
        {/* Градиенты слияния для бесшовного перехода */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#112118] to-transparent z-10 hidden lg:block" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#112118] to-transparent z-10 lg:hidden" />
        
        {/* Цветной оверлей для стиля */}
        <div className="absolute inset-0 bg-[#CDFF00]/5 mix-blend-overlay z-10 pointer-events-none" />

        {/* Кинематографичная Пыльца поверх видео */}
        <Particles />

        {/* Видео-фон. Если видео нет, браузер покажет poster (фотографию). Чтобы вставить видео, просто кинь bee.mp4 в public/videos/ */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          poster="/images/ecology.png"
          className="absolute inset-0 w-full h-full object-cover object-center filter contrast-110 brightness-[0.85] opacity-90"
        >
          <source src="/videos/bee.mp4" type="video/mp4" />
        </video>
        
      </div>
    </section>
  );
}
