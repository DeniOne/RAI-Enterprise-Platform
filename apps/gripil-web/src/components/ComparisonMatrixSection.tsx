"use client";

import { useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Check, X } from "lucide-react";

type ComparisonItem = {
  pros: string[];
  cons: string[];
  popular?: boolean;
};

const comparisonData: Record<string, ComparisonItem> = {
  клеи: {
    pros: ["Склеивают стручок внешне"],
    cons: [
      "Не дышат: останавливают созревание",
      "Создают 'парник' внутри стручка (плесень)",
      "Смываются первым дождём (ПВА основа)",
    ],
  },
  десикация: {
    pros: ["Быстро подсушивают посевы", "Облегчают работу комбайну"],
    cons: [
      "Огромные экологические риски (глифосат)",
      "Жёсткий стресс для растения",
      "Не защищает стручок от удара",
      "Запрещено в Европе",
    ],
  },
  грипил: {
    popular: true,
    pros: [
      "Мембрана из хвойных смол",
      "Дышит: стручок дозревает естественно",
      "Улучшает налив масличности семян",
      "Устойчив к 3–4 нед. агрессивных дождей",
      "Снижает влажность (экономия на сушке)",
      "100% биоразлагаем — безопасен для пчёл",
    ],
    cons: [],
  },
};

export default function ComparisonMatrixSection() {
  const ref = useRef<HTMLDivElement>(null);
  
  // Создаем свои MotionValues для координат курсора, так как usePointerPosition депрекейтнут
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [x, y]);

  // Отслеживаем координаты относительно окна для эффекта свечения
  // Но нам нужны координаты внутри контейнера
  const mouseX = useTransform(x, (currentX) => {
    if (!ref.current) return 0;
    const rect = ref.current.getBoundingClientRect();
    return currentX - rect.left;
  });
  const mouseY = useTransform(y, (currentY) => {
    if (!ref.current) return 0;
    const rect = ref.current.getBoundingClientRect();
    return currentY - rect.top;
  });

  return (
    <section className="py-10 md:py-14 lg:py-20 bg-[#EFECE6] text-[#112118] px-4 sm:px-8 lg:px-12 border-t border-[#112118]/5 relative overflow-visible font-sans">
      <div className="max-w-[1440px] mx-auto flex flex-col items-center">

        {/* Header */}
        <div className="mb-8 md:mb-10 lg:mb-14 text-center w-full max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-4 mb-5"
          >
            <div className="w-10 h-[1px] bg-[#112118]/30" />
            <span className="text-[#112118]/50 font-mono tracking-[0.2em] uppercase text-[10px] sm:text-xs">
              Объективное сравнение
            </span>
            <div className="w-10 h-[1px] bg-[#112118]/30" />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-display font-medium tracking-tight leading-tight">
            Почему синтетика и десиканты{" "}
            <span className="italic text-[#112118]/35 line-through">проигрывают?</span>
          </h2>
        </div>

        {/* Always 3 columns — compact */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 lg:gap-6 w-full items-start">
          {Object.entries(comparisonData).map(([key, data], colIdx) => {
            const isGripil = key === "грипил";
            return (
              <motion.div
                key={key}
                ref={isGripil ? ref : undefined}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: colIdx * 0.1 }}
                className={`relative pt-8 pb-5 px-4 sm:px-4 md:px-5 lg:px-6 flex flex-col rounded-sm overflow-hidden ${
                  isGripil
                    ? "bg-[#112118] text-[#EFECE6] shadow-2xl"
                    : "border border-[#112118]/12 text-[#112118]"
                }`}
              >
                {/* Активное свечение за курсором для Gripil */}
                {isGripil && (
                  <motion.div
                    className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 mix-blend-screen"
                    style={{
                      background: useTransform(
                        [mouseX, mouseY],
                        ([cx, cy]) =>
                          `radial-gradient(400px circle at ${cx}px ${cy}px, rgba(205,255,0,0.1), transparent 40%)`
                      ),
                    }}
                  />
                )}

                {/* Базовый градиент Gripil */}
                {isGripil && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#CDFF00]/5 to-transparent pointer-events-none" />
                )}

                <div className="relative z-10 w-full flex flex-col h-full">
                {/* ИННОВАЦИЯ badge */}
                {data.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#CDFF00] text-[#112118] px-3 py-[3px] text-[9px] font-mono font-bold uppercase tracking-widest shadow">
                    Инновация
                  </div>
                )}

                {/* Title */}
                <h3 className={`text-sm sm:text-sm md:text-base lg:text-lg font-display font-medium mb-4 text-center capitalize ${
                  isGripil ? "text-[#EFECE6]" : "text-[#112118]"
                }`}>
                  {key === "клеи" ? "Синтетические клеи" : key === "грипил" ? "Грипил" : "Десикация"}
                </h3>

                {/* Items */}
                <div className="flex flex-col gap-2">
                  {data.pros.map((pro, i) => (
                    <div key={`pro-${i}`} className="flex gap-2 items-start">
                      <div className={`mt-0.5 w-4 h-4 flex items-center justify-center shrink-0 rounded-[3px] ${
                        isGripil ? "bg-[#EFECE6]/12" : "bg-[#112118]/6"
                      }`}>
                        <Check className={`w-2.5 h-2.5 ${isGripil ? "text-white" : "text-[#112118]/60"}`} />
                      </div>
                      <span className={`text-[11px] sm:text-[11px] md:text-xs lg:text-sm leading-[1.5] ${
                        isGripil ? "text-[#EFECE6]/85" : "text-[#112118]/80"
                      }`}>{pro}</span>
                    </div>
                  ))}
                  {data.cons.map((con, i) => (
                    <div key={`con-${i}`} className="flex gap-2 items-start">
                      <div className="mt-0.5 w-4 h-4 flex items-center justify-center shrink-0 rounded-[3px] bg-red-500/10">
                        <X className="w-2.5 h-2.5 text-red-500" />
                      </div>
                      <span className={`text-[11px] sm:text-[11px] md:text-xs lg:text-sm leading-[1.5] font-light ${
                        isGripil ? "text-[#EFECE6]/60" : "text-[#112118]/55"
                      }`}>{con}</span>
                    </div>
                  ))}
                </div>

                {/* CTA in Gripil */}
                {isGripil && (
                  <button 
                    onClick={() => document.getElementById('cta-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="mt-6 w-full py-2.5 bg-[#EFECE6] text-[#112118] font-mono font-bold uppercase tracking-widest text-[10px] rounded-sm hover:bg-white transition-colors"
                  >
                    Рассчитать партию
                  </button>
                )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
