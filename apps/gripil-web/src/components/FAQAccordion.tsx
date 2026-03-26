"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Можно ли применять ГРИПИЛ вместе с десикантами?",
    a: "Да, ГРИПИЛ совместим в баковых смесях с большинством десикантов. Однако его использование часто позволяет полностью отказаться от жесткой десикации, давая семенам время на естественное дозревание и набор масличности."
  },
  {
    q: "Как быстро препарат смывается дождем?",
    a: "Полимерная структура ГРИПИЛ кристаллизуется за 30-40 минут после обработки. После этого мембрана не смывается осадками и выдерживает до 4 недель агрессивных дождей без потери прочности."
  },
  {
    q: "На сколько повышается урожайность?",
    a: "В среднем, предотвращение осыпания сохраняет от 1.5 до 4 центнеров с гектара. На гибридах с высоким риском растрескивания и при ветреной погоде этот показатель может достигать 5-7 ц/га."
  },
  {
    q: "Какой расход препарата на гектар?",
    a: "Расход препарата составляет от 0.7 до 1.0 л/га. Рабочего раствора потребуется около 150-200 л/га при наземном опрыскивании и 50 л/га при авиаобработке."
  }
];

export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-32 bg-[#EFECE6] text-[#112118] px-6 lg:px-12 border-t border-[#112118]/5 font-sans">
      <div className="max-w-[880px] mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <motion.div
             initial={{ opacity: 0, y: -20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="flex items-center justify-center gap-4 mb-6"
          >
             <div className="w-12 h-[1px] bg-[#112118]/40" />
             <span className="text-[#112118]/60 font-mono tracking-[0.2em] uppercase text-xs">
               База знаний
             </span>
             <div className="w-12 h-[1px] bg-[#112118]/40" />
          </motion.div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-medium tracking-tight mb-6">
            Отвечаем на <span className="text-[#555] italic">главное</span>
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className={`cursor-pointer rounded-sm border transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? "bg-[#112118]/[0.02] border-[#112118]/20 shadow-md shadow-[#112118]/5" 
                    : "bg-transparent border-[#112118]/10 hover:border-[#112118]/20 hover:shadow-sm"
                }`}
              >
                <div className="p-6 md:p-8 flex items-center justify-between gap-6">
                  <h3 className="text-xl md:text-2xl font-display font-medium text-[#112118]">
                    {faq.q}
                  </h3>
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isOpen 
                      ? "bg-[#112118] text-[#EFECE6]" 
                      : "bg-transparent border-[1.5px] border-[#999] text-[#666]"
                  }`}>
                    {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                </div>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 md:px-8 pb-8 text-[#112118]/80 text-lg leading-[1.6] font-normal">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
