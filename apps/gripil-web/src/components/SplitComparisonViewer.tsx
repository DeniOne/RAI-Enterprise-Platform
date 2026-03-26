"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export default function SplitComparisonViewer() {
  const containerRef = useRef<HTMLElement>(null);
  
  // Этот скролл-трекер будет работать на общей высоте модуля (например, 300vh)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Логика Morph-трансформации (шторка "До/После" управляется страницей привязанной к скроллу)
  // 0 -> 1 progress means shrinking the "healthy" image from clip-path 100% to 0% width.
  const clipPathValue = useTransform(scrollYProgress, [0.1, 0.9], [100, 0]);
  const clipPath = useTransform(clipPathValue, (val) => `inset(0 ${100 - val}% 0 0)`);

  const textOpacitySafe = useTransform(scrollYProgress, [0, 0.4, 0.5], [1, 1, 0]);
  const textOpacityLoss = useTransform(scrollYProgress, [0.5, 0.6, 1], [0, 1, 1]);

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-[300vh] bg-[#112118]" // Темный блок для контраста
    >
      <div className="sticky top-0 w-full h-screen overflow-hidden flex items-center justify-center">
        
        {/* Фоновое изображение (Без защиты - Потери) */}
        <div className="absolute inset-0 w-full h-full">
          <Image 
            src="/images/shattered.png" 
            alt="Растрескавшийся стручок рапса" 
            fill 
            sizes="100vw"
            quality={90}
            className="object-cover object-center filter grayscale-[30%] contrast-125 brightness-[0.7]" 
          />
          {/* Слой затемнения для выразительности текста */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#112118] via-transparent to-[#112118]/50" />
        </div>

        {/* Переднее изображение (С защитой ГРИПИЛ) */}
        <motion.div 
          style={{ clipPath }}
          className="absolute inset-0 w-full h-full z-10"
        >
          <Image 
            src="/images/healthy.png" 
            alt="Здоровый целый стручок рапса" 
            fill
            sizes="100vw"
            quality={100}
            className="object-cover object-center filter contrast-110 brightness-[0.9]" 
          />
          <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Свечение на границе шторки */}
          <div className="absolute inset-y-0 right-0 w-[2px] bg-[#CDFF00] shadow-[0_0_20px_#CDFF00]" />
        </motion.div>

        {/* UI Overlay - Пояснения для агронома */}
        <div className="relative z-20 w-full max-w-[1440px] px-6 lg:px-16 flex justify-between items-end pb-12 h-full">
          
          <motion.div 
            style={{ opacity: textOpacitySafe }}
            className="max-w-md text-left"
          >
            <div className="inline-block px-3 py-1 mb-6 bg-[rgba(34,100,60,0.85)] rounded-sm">
              <span className="text-white font-mono text-xs uppercase tracking-widest">Обработка ГРИПИЛ</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-display text-[#EFECE6] mb-4 [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">Урожай удержан</h3>
            <p className="text-[#EFECE6]/80 font-normal text-lg text-left [text-shadow:0_2px_12px_rgba(0,0,0,0.3)]">
              Мембрана запечатала шов стручка. Сохранность достигает 98% даже при сильном ветре.
            </p>
          </motion.div>

          <motion.div 
            style={{ opacity: textOpacityLoss }}
            className="max-w-md text-right absolute right-6 lg:right-16 bottom-12 mr-6"
          >
            <div className="inline-block px-3 py-1 mb-6 bg-[rgba(150,30,30,0.85)] border-none rounded-sm">
              <span className="text-white font-mono text-xs uppercase tracking-widest">Без защиты</span>
            </div>
            <h3 className="text-4xl md:text-5xl font-display text-[#EFECE6] mb-4 [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]">Потеря выручки</h3>
            <p className="text-[#EFECE6]/80 font-normal text-lg text-right [text-shadow:0_2px_12px_rgba(0,0,0,0.3)]">
              Стручок вскрылся по швам. Черные семена осыпались на почву. Экономический результат гектара снижен.
            </p>
          </motion.div>
          
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
          <span className="text-[#EFECE6]/40 text-[10px] uppercase tracking-[0.3em] font-mono animate-pulse">Скролльте</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-[#EFECE6]/50 to-transparent relative overflow-hidden">
            <motion.div 
              animate={{ y: [0, 64, 0] }}
              transition={{ duration: 2, ease: "linear", repeat: Infinity }}
              className="absolute top-0 w-full h-8 bg-gradient-to-b from-transparent via-[#CDFF00] to-transparent" 
            />
          </div>
        </div>

      </div>
    </section>
  );
}
