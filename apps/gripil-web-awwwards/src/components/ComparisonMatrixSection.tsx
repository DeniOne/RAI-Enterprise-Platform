"use client";

import type { MouseEvent } from "react";
import { motion, useMotionTemplate, useMotionValue, useTransform } from "framer-motion";
import { Check, X } from "lucide-react";
import { EMPHATIC_EASE } from "@/lib/motion";

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
      "Создают парниковый эффект внутри стручка",
      "Смываются первым сильным дождём",
    ],
  },
  десикация: {
    pros: ["Быстро подсушивает посевы", "Облегчает заход уборочной техники"],
    cons: [
      "Создаёт экологические риски",
      "Даёт жёсткий стресс для растения",
      "Не защищает шов стручка от удара",
      "Снижает гибкость окна уборки",
    ],
  },
  грипил: {
    popular: true,
    pros: [
      "Мембрана на основе хвойных смол",
      "Стручок дозревает естественно",
      "Поддерживает налив и масличность",
      "Держит 3–4 недели агрессивной погоды",
      "Снижает влажность и расходы на сушку",
      "Биоразлагаем и безопасен для пчёл",
    ],
    cons: [],
  },
};

export default function ComparisonMatrixSection() {
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(50);
  const tiltX = useTransform(pointerY, (value) => (50 - value) / 6);
  const tiltY = useTransform(pointerX, (value) => (value - 50) / 6);
  const glow = useMotionTemplate`radial-gradient(420px circle at ${pointerX}% ${pointerY}%, rgba(205,255,0,0.16), transparent 45%)`;
  const halo = useMotionTemplate`radial-gradient(280px circle at ${pointerX}% ${pointerY}%, rgba(239,236,230,0.14), transparent 60%)`;

  function handleGripilMove(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    pointerX.set(x);
    pointerY.set(y);
  }

  function resetGripilPointer() {
    pointerX.set(50);
    pointerY.set(50);
  }

  return (
    <section className="relative overflow-visible border-t border-[#112118]/5 bg-[#EFECE6] px-4 py-10 font-sans text-[#112118] md:py-14 lg:px-12 lg:py-20">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center">
        <div className="mb-8 w-full max-w-3xl text-center md:mb-10 lg:mb-14">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EMPHATIC_EASE }}
            className="mb-5 flex items-center justify-center gap-4"
          >
            <div className="h-[1px] w-10 bg-[#112118]/30" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#112118]/50 sm:text-xs">
              Объективное сравнение
            </span>
            <div className="h-[1px] w-10 bg-[#112118]/30" />
          </motion.div>

          <h2 className="font-display text-2xl font-medium leading-tight tracking-tight sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">
            Почему синтетика и десиканты{" "}
            <span className="italic text-[#112118]/35 line-through">проигрывают</span>
          </h2>
        </div>

        <div className="grid w-full grid-cols-1 items-start gap-3 sm:grid-cols-3 md:gap-4 lg:gap-6">
          {Object.entries(comparisonData).map(([key, data], colIdx) => {
            const isGripil = key === "грипил";

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: colIdx * 0.1, ease: EMPHATIC_EASE }}
                onMouseMove={isGripil ? handleGripilMove : undefined}
                onMouseLeave={isGripil ? resetGripilPointer : undefined}
                style={
                  isGripil
                    ? {
                        rotateX: tiltX,
                        rotateY: tiltY,
                        transformPerspective: 1200,
                      }
                    : undefined
                }
                className={`relative flex flex-col overflow-hidden rounded-sm px-4 pb-5 pt-8 sm:px-4 md:px-5 lg:px-6 ${
                  isGripil
                    ? "group bg-[#112118] text-[#EFECE6] shadow-[0_24px_90px_rgba(17,33,24,0.28)] [transform-style:preserve-3d]"
                    : "border border-[#112118]/12 text-[#112118]"
                }`}
              >
                {isGripil && (
                  <>
                    <motion.div className="pointer-events-none absolute -inset-px mix-blend-screen" style={{ background: glow }} />
                    <motion.div className="pointer-events-none absolute inset-0 opacity-80" style={{ background: halo }} />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(205,255,0,0.08),transparent_38%,rgba(239,236,230,0.05)_100%)]" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[#CDFF00]/50 to-transparent" />
                  </>
                )}

                <div className="relative z-10 flex h-full flex-col">
                  {data.popular && (
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-[#CDFF00] px-3 py-[3px] font-mono text-[9px] font-bold uppercase tracking-widest text-[#112118] shadow">
                      Инновация
                    </div>
                  )}

                  <h3
                    className={`mb-4 text-center font-display text-sm font-medium capitalize sm:text-sm md:text-base lg:text-lg ${
                      isGripil ? "text-[#EFECE6]" : "text-[#112118]"
                    }`}
                  >
                    {key === "клеи" ? "Синтетические клеи" : key === "грипил" ? "ГРИПИЛ" : "Десикация"}
                  </h3>

                  <div className="flex flex-col gap-2">
                    {data.pros.map((pro) => (
                      <div key={pro} className="flex items-start gap-2">
                        <div
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] ${
                            isGripil ? "bg-[#EFECE6]/12" : "bg-[#112118]/6"
                          }`}
                        >
                          <Check className={`h-2.5 w-2.5 ${isGripil ? "text-white" : "text-[#112118]/60"}`} />
                        </div>
                        <span
                          className={`text-[11px] leading-[1.5] sm:text-[11px] md:text-xs lg:text-sm ${
                            isGripil ? "text-[#EFECE6]/85" : "text-[#112118]/80"
                          }`}
                        >
                          {pro}
                        </span>
                      </div>
                    ))}

                    {data.cons.map((con) => (
                      <div key={con} className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] bg-red-500/10">
                          <X className="h-2.5 w-2.5 text-red-500" />
                        </div>
                        <span
                          className={`text-[11px] font-light leading-[1.5] sm:text-[11px] md:text-xs lg:text-sm ${
                            isGripil ? "text-[#EFECE6]/60" : "text-[#112118]/55"
                          }`}
                        >
                          {con}
                        </span>
                      </div>
                    ))}
                  </div>

                  {isGripil && (
                    <div className="mt-6 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-[#EFECE6]/55">
                        <div className="border border-[#EFECE6]/10 bg-[#EFECE6]/[0.03] px-3 py-3">
                          Потери
                          <div className="mt-2 font-display text-2xl tracking-tight text-[#CDFF00]">-12–18%</div>
                        </div>
                        <div className="border border-[#EFECE6]/10 bg-[#EFECE6]/[0.03] px-3 py-3">
                          Сушка
                          <div className="mt-2 font-display text-2xl tracking-tight text-[#EFECE6]">ниже</div>
                        </div>
                      </div>

                      <button
                        onClick={() => document.getElementById("cta-section")?.scrollIntoView({ behavior: "smooth" })}
                        className="w-full rounded-sm bg-[#EFECE6] py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#112118] transition-colors hover:bg-white"
                      >
                        Рассчитать партию
                      </button>
                    </div>
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
