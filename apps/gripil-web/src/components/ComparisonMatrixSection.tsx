"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

export default function ComparisonMatrixSection() {
  const [activeTab, setActiveTab] = useState<"клеи" | "десикация" | "грипил">("грипил");

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
        "Смываются первым дождем (ПВА основа)"
      ]
    },
    десикация: {
      pros: ["Быстро подсушивают посевы", "Облегчают работу комбайну"],
      cons: [
        "Огромные экологические риски (глифосат)",
        "Жесткий стресс для растения",
        "Не защищает стручок от удара",
        "Запрещено в Европе"
      ]
    },
    грипил: {
      popular: true,
      pros: [
        "Образует мембрану из хвойных смол",
        "Дышит: стручок дозревает естественно",
        "Улучшает налив масличности семян",
        "Устойчив к 3-4 неделям агрессивных дождей",
        "Снижает влажность (экономия на сушке)",
        "100% биоразлагаем (безопасен для пчел)"
      ],
      cons: []
    }
  };

  return (
    <section className="py-20 md:py-32 lg:py-48 bg-[#EFECE6] text-[#112118] px-5 sm:px-8 lg:px-16 border-t border-[#112118]/5 relative overflow-hidden font-sans">
      <div className="max-w-[1440px] mx-auto flex flex-col items-center">
        
        <div className="mb-10 md:mb-16 lg:mb-24 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-4 mb-8"
          >
             <div className="w-12 h-[1px] bg-[#112118]/40" />
             <span className="text-[#112118]/60 font-mono tracking-[0.2em] uppercase text-xs">
               Объективное сравнение
             </span>
             <div className="w-12 h-[1px] bg-[#112118]/40" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-medium tracking-tight mb-6">
            Почему синтетические клеи и десиканты <br/><span className="italic text-[#112118]/40 line-through">проигрывают?</span>
          </h2>
        </div>

        {/* Моб. табы */}
        <div className="flex md:hidden w-full gap-2 mb-8 bg-[#112118]/5 p-1.5 rounded-sm">
          {["клеи", "десикация", "грипил"].map((tab) => (
             <button 
               key={tab} 
               onClick={() => setActiveTab(tab as any)}
               className={`flex-1 py-3 px-4 rounded-sm text-xs font-mono font-bold uppercase tracking-widest transition-all ${
                 activeTab === tab ? "bg-[#112118] text-[#EFECE6] shadow-md" : "text-[#112118]/50 hover:text-[#112118]"
               }`}
             >
               {tab === "клеи" ? "Синтетика" : tab}
             </button>
          ))}
        </div>

        {/* Десктоп Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4 lg:gap-8 w-full items-stretch">
          {Object.entries(comparisonData).map(([key, data]) => {
            const isGripil = key === "грипил";
            return (
              <motion.div 
                key={key}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`p-6 md:p-7 lg:p-10 transition-all duration-500 flex flex-col min-h-[400px] lg:min-h-[480px] ${
                  activeTab === key ? "flex md:flex" : "hidden md:flex"
                } ${
                  isGripil 
                    ? "bg-[#112118] text-[#EFECE6] rounded-sm shadow-[0_4px_32px_rgba(17,33,24,0.15)] md:-translate-y-4 md:shadow-2xl z-10" 
                    : "bg-transparent border border-[#e0ddd8] shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-[#112118] opacity-80 md:hover:opacity-100 rounded-sm"
                }`}
              >
                {data.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#CDFF00] text-[#112118] px-4 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest shadow-lg">
                    Инновация
                  </div>
                )}
                
                <h3 className={`text-3xl font-display font-light mb-8 capitalize text-center ${isGripil ? "text-[#EFECE6]" : "text-[#112118]"}`}>
                  {key === "клеи" ? "Синтетические клеи" : key}
                </h3>
                
                <div className="flex-1 flex flex-col space-y-5">
                  {data.pros.map((pro, i) => (
                    <div key={`pro-${i}`} className="flex gap-4 items-start">
                      <div className={`mt-1 w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${isGripil ? 'bg-[#EFECE6]/10' : 'bg-[#112118]/5'}`}>
                        <Check className={`w-5 h-5 ${isGripil ? 'text-white' : 'text-[#112118]/60'}`} />
                      </div>
                      <span className={`text-base leading-[1.6] ${isGripil ? 'text-[#EFECE6]/90' : 'text-[#112118]/80'}`}>{pro}</span>
                    </div>
                  ))}

                  {data.cons.map((con, i) => (
                    <div key={`con-${i}`} className="flex gap-4 items-start opacity-80">
                      <div className="mt-1 w-7 h-7 rounded-sm flex items-center justify-center shrink-0 bg-red-500/10">
                        <X className="w-5 h-5 text-red-500" />
                      </div>
                      <span className={`text-base leading-[1.6] font-light ${isGripil ? 'text-[#EFECE6]/70' : 'text-[#112118]/60'}`}>{con}</span>
                    </div>
                  ))}
                </div>

                {isGripil && (
                  <button className="mt-auto pt-10 w-full text-center group">
                    <div className="py-4 bg-[#EFECE6] text-[#112118] font-mono font-bold uppercase tracking-widest text-[11px] rounded-sm hover:bg-white transition-colors">
                      Рассчитать партию
                    </div>
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
