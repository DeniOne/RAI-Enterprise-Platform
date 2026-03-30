"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { useViewportProfile } from "@/lib/useViewportProfile";

const faqs = [
  {
    q: "Можно ли применять ГРИПИЛ вместе с десикантами?",
    a: "Да, ГРИПИЛ совместим в баковых смесях с большинством десикантов. Однако его использование часто позволяет полностью отказаться от жёсткой десикации, давая семенам время на естественное дозревание и набор масличности.",
  },
  {
    q: "Как быстро препарат смывается дождём?",
    a: "Полимерная структура ГРИПИЛ кристаллизуется за 30-40 минут после обработки. После этого мембрана не смывается осадками и выдерживает до четырёх недель агрессивных дождей без потери прочности.",
  },
  {
    q: "На сколько повышается урожайность?",
    a: "В среднем предотвращение осыпания сохраняет от 1,5 до 4 центнеров с гектара. На гибридах с высоким риском растрескивания и при ветреной погоде эффект может быть выше, но точный расчёт лучше делать по сценарию вашего поля.",
  },
  {
    q: "Какой расход препарата на гектар?",
    a: "Расход препарата составляет от 0,7 до 1,0 литра на гектар. Рабочего раствора требуется около 150-200 литров на гектар при наземном опрыскивании и около 50 литров на гектар при авиаобработке.",
  },
];

export default function FAQAccordion() {
  const viewport = useViewportProfile();
  const isCompact = viewport.isMobileOrTablet || viewport.isLowHeightDesktop;
  const [openIndex, setOpenIndex] = useState<number | null>(isCompact ? null : 0);

  return (
    <section className={`border-t border-[#112118]/5 bg-[#EFECE6] px-5 font-sans text-[#112118] sm:px-8 lg:px-12 ${isCompact ? "py-8 sm:py-9" : "py-10 sm:py-12 md:py-14"}`}>
      <div className="mx-auto max-w-[1220px]">
        <div className={isCompact ? "mb-6 md:mb-8" : "mb-10 md:mb-14 lg:mb-16"}>
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="mb-6 flex items-center justify-center gap-4"
          >
            <div className="h-[1px] w-12 bg-[#112118]/40" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#112118]/60">База знаний</span>
            <div className="h-[1px] w-12 bg-[#112118]/40" />
          </motion.div>
          <h2 className={`mb-6 font-display font-medium tracking-tight ${isCompact ? "text-3xl sm:text-4xl lg:text-[3.25rem]" : "text-3xl sm:text-4xl md:text-5xl lg:text-[4.4rem] xl:text-[4.8rem]"}`}>
            Отвечаем на <span className="italic text-[#555]">главное</span>
          </h2>
        </div>

        <div className={isCompact ? "space-y-3" : "space-y-4"}>
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const triggerId = `faq-trigger-${idx}`;
            const panelId = `faq-panel-${idx}`;

            return (
              <motion.div
                key={faq.q}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.06, ease: "easeOut" }}
                className={`overflow-hidden rounded-sm border transition-all duration-300 ${
                  isOpen
                    ? "border-[#112118]/20 bg-[#112118]/[0.02] shadow-md shadow-[#112118]/5"
                    : "border-[#112118]/10 bg-transparent hover:border-[#112118]/20 hover:shadow-sm"
                }`}
              >
                <h3>
                  <button
                    id={triggerId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className={`flex w-full items-center justify-between gap-6 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#112118]/45 ${isCompact ? "p-5 md:p-6" : "p-6 md:p-7"}`}
                  >
                    <span className={`${isCompact ? "text-lg md:text-[1.45rem]" : "text-xl md:text-[1.85rem]"} font-display font-medium text-[#112118]`}>
                      {faq.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`flex shrink-0 items-center justify-center rounded-full transition-all ${
                        isOpen ? "bg-[#112118] text-[#EFECE6]" : "border-[1.5px] border-[#999] bg-transparent text-[#666]"
                      } ${isCompact ? "h-9 w-9" : "h-10 w-10"}`}
                    >
                      {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={triggerId}
                      initial={false}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className={`${isCompact ? "px-5 pb-6 text-[15px] leading-[1.6] md:px-6" : "px-6 pb-8 text-[1.05rem] leading-[1.7] md:px-7"} font-normal text-[#112118]/80`}>
                        {faq.a}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
